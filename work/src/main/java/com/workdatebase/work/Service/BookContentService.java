package com.workdatebase.work.Service;

import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.BookContent;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.repository.BookContentRepository;
import com.workdatebase.work.repository.BookRepository;
import com.workdatebase.work.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BookContentService {
    
    private final BookContentRepository bookContentRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    
    @Value("${book.content.upload-dir:uploads/book-contents}")
    private String uploadDir;
    
    @Value("${book.content.max-file-size:10485760}") // 10MB
    private long maxFileSize;
    
    @Value("${book.content.allowed-types:pdf,epub,txt,html,md}")
    private String allowedTypes;
    
    public BookContentService(BookContentRepository bookContentRepository,
                            BookRepository bookRepository,
                            UserRepository userRepository) {
        this.bookContentRepository = bookContentRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }
    
    // 上传图书内容
    @Transactional
    public BookContent uploadBookContent(Long bookId, MultipartFile file, 
                                       BookContent.ContentType contentType,
                                       Boolean isPublic, Boolean allowDownload,
                                       Long userId) throws IOException {
        
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        // 检查文件大小
        if (file.getSize() > maxFileSize) 
        {
            throw new RuntimeException("文件大小超过限制，最大允许 " + (maxFileSize / 1024 / 1024) + "MB");
        }
        
        // 检查文件类型
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        if (!isAllowedFileType(fileExtension, contentType)) 
        {
            throw new RuntimeException("不支持的文件类型: " + fileExtension);
        }
        
        // 创建上传目录
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) 
        {
            Files.createDirectories(uploadPath);
        }
        
        // 生成唯一的文件名
        String uniqueFileName = generateUniqueFileName(bookId, fileExtension);
        Path filePath = uploadPath.resolve(uniqueFileName);
        
        // 保存文件
        Files.copy(file.getInputStream(), filePath);
        
        // 创建或更新图书内容记录
        Optional<BookContent> existingContent = bookContentRepository.findByBookId(bookId);
        BookContent bookContent;
        
        if (existingContent.isPresent()) 
        {
            bookContent = existingContent.get();
            // 删除旧文件
            if (bookContent.getFilePath() != null) 
            {
                Path oldFilePath = Paths.get(bookContent.getFilePath());
                Files.deleteIfExists(oldFilePath);
            }
        } 
        else 
        {
            bookContent = new BookContent();
            bookContent.setBook(book);
        }
        
        // 设置内容属性
        bookContent.setContentType(contentType);
        bookContent.setFilePath(filePath.toString());
        bookContent.setFileSize(file.getSize());
        bookContent.setIsPublic(isPublic != null ? isPublic : false);
        bookContent.setAllowDownload(allowDownload != null ? allowDownload : false);
        bookContent.setUploadTime(new Date());
        
        // 如果是文本文件，提取文本内容用于搜索
        if (contentType == BookContent.ContentType.TXT || 
            contentType == BookContent.ContentType.HTML ||
            contentType == BookContent.ContentType.MARKDOWN) 
        {
            
            String textContent = extractTextContent(file);
            bookContent.setContentText(textContent);
            
            // 如果是TXT文件，尝试估算页数（假设每页2000字符）
            if (contentType == BookContent.ContentType.TXT && textContent.length() > 0)
            {
                int estimatedPages = (int) Math.ceil(textContent.length() / 2000.0);
                bookContent.setTotalPages(Math.max(1, estimatedPages));
            }
        }
        
        return bookContentRepository.save(bookContent);
    }
    
    // 获取图书内容
    public Optional<BookContent> getBookContent(Long bookId) {
        try 
        {
            return bookContentRepository.findByBookId(bookId);
        }
        catch (Exception e) 
        {
            // 如果发生异常（如表不存在），返回空
            return Optional.empty();
        }
    }

    public Map<Long, Boolean> batchCheckBookContent(List<Long> bookIds) {
        Map<Long, Boolean> result = new HashMap<>();
        
        for (Long bookId : bookIds) {
            try 
            {
                result.put(bookId, bookContentRepository.findByBookId(bookId).isPresent());
            } 
            catch (Exception e) 
            {
                // 如果发生异常，设为false
                result.put(bookId, false);
            }
        }
        
        return result;
    }

    public boolean hasBookContent(Long bookId) {
        try 
        {
            return bookContentRepository.findByBookId(bookId).isPresent();
        } 
        catch (Exception e) 
        {
            // 如果发生异常（如表不存在），返回false
            return false;
        }
    }
    
    // 检查用户是否有权限阅读
    public boolean canUserReadContent(Long bookId, Long userId) {
        Optional<BookContent> contentOpt = bookContentRepository.findByBookId(bookId);
        
        if (contentOpt.isEmpty()) 
        {
            return false; // 没有内容
        }
        
        BookContent content = contentOpt.get();
        
        // 如果是公开内容，任何人都可以阅读
        if (Boolean.TRUE.equals(content.getIsPublic())) 
        {
            return true;
        }
        
        // 检查用户是否登录
        if (userId == null) 
        {
            return false;
        }
        
        // 检查用户是否有借阅记录
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) 
        {
            return false;
        }
        return true;
    }
    
    // 记录阅读历史
    @Transactional
    public void recordReading(Long bookId, Long userId, Integer currentPage) {
        Optional<BookContent> contentOpt = bookContentRepository.findByBookId(bookId);
        if (contentOpt.isPresent()) {
            BookContent content = contentOpt.get();
            
            // 更新查看计数
            bookContentRepository.incrementViewCount(content.getId());

        }
    }
    
    // 获取阅读内容（分页，用于文本内容）
    public Map<String, Object> getContentForReading(Long bookId, Integer page, Integer pageSize) {
        Optional<BookContent> contentOpt = bookContentRepository.findByBookId(bookId);
        
        Map<String, Object> result = new HashMap<>();
        
        if (contentOpt.isEmpty()) 
        {
            result.put("success", false);
            result.put("message", "图书内容不存在");
            return result;
        }
        
        BookContent content = contentOpt.get();
        
        result.put("success", true);
        result.put("contentType", content.getContentType());
        result.put("totalPages", content.getTotalPages());
        result.put("allowDownload", content.getAllowDownload());
        
        // 根据内容类型返回不同的数据
        switch (content.getContentType()) 
        {
            case TXT:
            case HTML:
            case MARKDOWN:
                if (content.getContentText() != null) 
                {
                    String fullText = content.getContentText();
                    int totalChars = fullText.length();
                    int charsPerPage = 2000; // 每页大约2000字符
                    
                    if (page == null || page < 1) page = 1;
                    if (pageSize == null || pageSize < 1) pageSize = charsPerPage;
                    
                    int startIndex = (page - 1) * pageSize;
                    int endIndex = Math.min(startIndex + pageSize, totalChars);
                    
                    if (startIndex >= totalChars) 
                    {
                        result.put("currentPage", page);
                        result.put("content", "");
                        result.put("hasNext", false);
                    } 
                    else {
                        String pageContent = fullText.substring(startIndex, endIndex);
                        result.put("currentPage", page);
                        result.put("content", pageContent);
                        result.put("hasNext", endIndex < totalChars);
                        result.put("totalCharacters", totalChars);
                    }
                }
                break;
                
            case PDF:
            case EPUB:
                // 对于二进制文件，返回文件路径
                result.put("filePath", content.getFilePath());
                result.put("fileName", getFileNameFromPath(content.getFilePath()));
                break;
                
            default:
                result.put("success", false);
                result.put("message", "不支持的内容类型");
                break;
        }
        
        return result;
    }
    
    // 搜索图书内容中的文本
    public List<Map<String, Object>> searchInContent(String keyword, Long bookId) {
        Optional<BookContent> contentOpt = bookContentRepository.findByBookId(bookId);
        List<Map<String, Object>> results = new ArrayList<>();
        
        if (contentOpt.isEmpty() || contentOpt.get().getContentText() == null) 
        {
            return results;
        }
        
        BookContent content = contentOpt.get();
        String text = content.getContentText();
        
        // 简单搜索实现
        Pattern pattern = Pattern.compile(Pattern.quote(keyword), Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        
        int charsPerPage = 2000;
        
        while (matcher.find()) 
        {
            Map<String, Object> match = new HashMap<>();
            int position = matcher.start();
            int page = (position / charsPerPage) + 1;
            
            // 获取上下文
            int start = Math.max(0, position - 100);
            int end = Math.min(text.length(), position + 100);
            String context = text.substring(start, end);
            
            // 高亮关键词
            context = context.replaceAll("(?i)" + Pattern.quote(keyword), 
                                       "<span class='highlight'>" + keyword + "</span>");
            
            match.put("page", page);
            match.put("context", context);
            match.put("position", position);
            results.add(match);
        }
        
        return results;
    }
    
    // 辅助方法
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) 
        {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
    
    private boolean isAllowedFileType(String extension, BookContent.ContentType contentType) {
        Set<String> allowedSet = new HashSet<>(Arrays.asList(allowedTypes.split(",")));
        return allowedSet.contains(extension);
    }
    
    private String generateUniqueFileName(Long bookId, String extension) {
        return "book_" + bookId + "_" + System.currentTimeMillis() + "." + extension;
    }
    
    private String extractTextContent(MultipartFile file) throws IOException {
        // 简单实现：直接读取文件内容
        return new String(file.getBytes(), "UTF-8");
    }
    
    private String getFileNameFromPath(String filePath) {
        if (filePath == null) 
        return null;
        return Paths.get(filePath).getFileName().toString();
    }
}
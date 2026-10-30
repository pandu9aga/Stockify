namespace Stockify.Api.DTOs;

public record RegisterRequest(string Username, string Email, string Password, string? Role);
public record LoginRequest(string UsernameOrEmail, string Password);
public record AuthResponse(string Token, string Username, string Email, string Role);

public record CategoryDto(int Id, string Name, string Description);
public record CreateCategoryRequest(string Name, string Description);

public record ProductDto(int Id, string Name, string SKU, decimal Price, int StockQuantity, int CategoryId, string? CategoryName);
public record CreateProductRequest(string Name, string SKU, decimal Price, int StockQuantity, int CategoryId);
public record UpdateProductRequest(string Name, string SKU, decimal Price, int StockQuantity, int CategoryId);


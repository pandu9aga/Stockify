namespace Stockify.Api.DTOs;

public record RegisterRequest(string Username, string Email, string Password, string? Role);
public record LoginRequest(string UsernameOrEmail, string Password);
public record AuthResponse(string Token, string Username, string Email, string Role);

public record CategoryDto(int Id, string Name, string Description);
public record CreateCategoryRequest(string Name, string Description);

public record ProductDto(int Id, string Name, string SKU, decimal Price, int StockQuantity, int CategoryId, string? CategoryName);
public record CreateProductRequest(string Name, string SKU, decimal Price, int StockQuantity, int CategoryId);
public record UpdateProductRequest(string Name, string SKU, decimal Price, int StockQuantity, int CategoryId);

// Stock Mutation DTOs
public record CreateStockMutationRequest(
    int ProductId,
    int Quantity,
    string Type, // "StockIn", "StockOut", "Adjustment", "Damaged"
    string Notes
);

public record StockMutationDto(
    int Id,
    int ProductId,
    string ProductName,
    string ProductSKU,
    int QuantityChanged,
    int PreviousStock,
    int CurrentStock,
    string Type,
    string Notes,
    string PerformedBy,
    DateTime CreatedAt
);

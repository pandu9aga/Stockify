namespace Stockify.Api.Models;

public enum MutationType
{
    StockIn,       // Barang masuk dari supplier / PO
    StockOut,      // Barang keluar / penjualan / pemakaian
    Adjustment,    // Koreksi stok (misal selisih fisik opname)
    Damaged        // Barang rusak / kadaluarsa
}

public class StockMutation
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int QuantityChanged { get; set; } // Nilai positif atau negatif
    public int PreviousStock { get; set; }
    public int CurrentStock { get; set; }

    public MutationType Type { get; set; }
    public string Notes { get; set; } = string.Empty;

    public int UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


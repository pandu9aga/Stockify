using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;

namespace Stockify.Desktop;

public partial class MainWindow : Window
{
    private readonly HttpClient _http = new();
    private const string ApiBaseUrl = "http://localhost:5000/api";
    private string _token = string.Empty;
    private List<ProductItem> _products = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await LoginAsync();
        await LoadProductsAsync();
    }

    private async Task LoginAsync()
    {
        try
        {
            var loginPayload = new { usernameOrEmail = "admin", password = "AdminPassword123!" };
            var content = new StringContent(JsonSerializer.Serialize(loginPayload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{ApiBaseUrl}/auth/login", content);
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                _token = doc.RootElement.GetProperty("token").GetString() ?? "";
                _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
                TxtStatus.Text = "● Terhubung (Admin)";
            }
        }
        catch
        {
            TxtStatus.Text = "⚠ Gagal terhubung ke API (Pastikan Docker running)";
            TxtStatus.Foreground = System.Windows.Media.Brushes.OrangeRed;
        }
    }

    private async Task LoadProductsAsync(string query = "")
    {
        try
        {
            var url = string.IsNullOrWhiteSpace(query) ? $"{ApiBaseUrl}/products" : $"{ApiBaseUrl}/products?search={query}";
            var response = await _http.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var items = JsonSerializer.Deserialize<List<ProductItem>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                _products = items ?? new();
                DgProducts.ItemsSource = _products;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error load data: {ex.Message}");
        }
    }

    private async void BtnRefresh_Click(object sender, RoutedEventArgs e)
    {
        await LoadProductsAsync();
    }

    private async void TxtBarcode_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            await LoadProductsAsync(TxtBarcode.Text.Trim());
        }
    }

    private async void BtnStockIn_Click(object sender, RoutedEventArgs e)
    {
        await PerformMutationAsync("StockIn", 1);
    }

    private async void BtnStockOut_Click(object sender, RoutedEventArgs e)
    {
        await PerformMutationAsync("StockOut", 1);
    }

    private async Task PerformMutationAsync(string type, int qty)
    {
        if (DgProducts.SelectedItem is not ProductItem selected)
        {
            MessageBox.Show("Pilih salah satu produk pada tabel terlebih dahulu!", "Pemberitahuan", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        try
        {
            var payload = new
            {
                productId = selected.Id,
                quantity = qty,
                type = type,
                notes = $"Desktop Counter POS Entry"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{ApiBaseUrl}/stockmutations", content);

            if (response.IsSuccessStatusCode)
            {
                await LoadProductsAsync();
                MessageBox.Show($"Mutasi {type} ({qty} Unit) untuk {selected.Name} berhasil!", "Sukses", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                var errJson = await response.Content.ReadAsStringAsync();
                MessageBox.Show($"Gagal: {errJson}", "Perhatian", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Terjadi kesalahan: {ex.Message}");
        }
    }
}

public class ProductItem
{
    public int Id { get; set; }
    public string Sku { get; set; } = "";
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string CategoryName { get; set; } = "";
    public string PriceFormatted => $"Rp {Price:N0}";
}

using System;
using System.Threading.Tasks;
using Supabase;

namespace server.Services
{
    public static class SupabaseClientService
    {
        private static Client? _client;

        // initialize supabaseclient for server side usage
        public static async Task<Client> GetClientAsync()
        {
            if (_client != null) return _client;

            var url = $"https://{Environment.GetEnvironmentVariable("SUPABASE_CLIENT")}.supabase.co";
            var key = Environment.GetEnvironmentVariable("SUPABASE_PASS");

            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = true
            };

            _client = new Client(url, key, options);

            try
            {
                await _client.InitializeAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Supabase client: {ex.Message}");
                throw;
            }

            return _client;
        }
    }

    public static class SupabaseConversationService
    {
        // ??????
    }

    public static class SupabaseMessageService
    {
        // ??????
    }
}

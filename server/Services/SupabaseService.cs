using server.Models;
using server.DTOs;
using Supabase;

namespace server.Services
{
    public class SupabaseService : ISupabaseService
    {
        private Client? _supabaseClient;
        private readonly string _url;
        private readonly string _key;

        public SupabaseService(string? url = null, string? key = null)
        {
            _url = url ?? $"https://{Environment.GetEnvironmentVariable("SUPABASE_CLIENT")}.supabase.co";
            _key = key ?? Environment.GetEnvironmentVariable("SUPABASE_ANON") ?? throw new ArgumentNullException("SUPABASE_ANON missing");
        }

        // initialize supabaseclient for server side usage
        public async Task<Client> GetClientAsync(string? jwt = null)
        {
            // Always create a new client when JWT is provided to ensure proper auth
            if (jwt != null)
            {
                return await CreateClientWithJwtAsync(jwt);
            }

            // Use cached client for server-side operations without JWT
            if (_supabaseClient != null) return _supabaseClient;

            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = false
            };

            var client = new Client(_url, _key, options);

            try
            {
                await client.InitializeAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Supabase client: {ex.Message}");
                throw;
            }

            // Cache the server-key client
            _supabaseClient = client;
            return client;
        }

        // Create a new client with JWT authentication
        private async Task<Client> CreateClientWithJwtAsync(string jwt)
        {
            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = false,
                // Set the JWT token in the headers for API requests
                Headers = new Dictionary<string, string>
                {
                    { "Authorization", $"Bearer {jwt}" }
                }
            };

            var client = new Client(_url, _key, options);

            try
            {
                await client.InitializeAsync();
                return client;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Supabase client with JWT: {ex.Message}");
                throw;
            }
        }

        public async Task<MessagesResponse> GetUserMessages(string userId, string? jwt = null)
        {
            try
            {
                var client = await GetClientAsync(jwt);

                var result = await client
                    .From<Message>()
                    .Where(x => x.UserId == userId)
                    .Order(x => x.CreatedAt, Supabase.Postgrest.Constants.Ordering.Ascending)
                    .Get();

                var messages = result.Models.Select(m => new MessageDto
                {
                    Text = m.Text,
                    Sender = m.Sender
                }).ToList();

                return new MessagesResponse
                {
                    Messages = messages,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user messages: {ex.Message}");
                return new MessagesResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<MessagesResponse> SaveMessage(CreateMessageRequest request, string jwt)
        {
            try
            {
                var client = await GetClientAsync(jwt);

                var message = new Message
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    Text = request.Text,
                    Sender = request.Sender,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await client.From<Message>().Insert(message);

                return new MessagesResponse
                {
                    Messages = new List<MessageDto>
                    {
                        new MessageDto
                        {
                            Text = message.Text,
                            Sender = message.Sender
                        }
                    },
                    Success = true
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving message: {ex.Message}");
                return new MessagesResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<MessagesResponse> ClearUserMessages(string userId, string jwt)
        {
            try
            {
                var client = await GetClientAsync(jwt);

                await client
                    .From<Message>()
                    .Where(x => x.UserId == userId)
                    .Delete();

                // Add the starting message back
                var startingMessage = new CreateMessageRequest
                {
                    UserId = userId,
                    Text = "",
                    Sender = ""
                };

                return await SaveMessage(startingMessage, jwt);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error clearing user messages: {ex.Message}");
                return new MessagesResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }
    }
}

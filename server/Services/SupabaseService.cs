using server.Models;
using server.DTOs;
using Supabase;

namespace server.Services
{
    public class SupabaseService : ISupabaseService
    {
        private Client? _supabaseClient;

        // initialize supabaseclient for server side usage
        public async Task<Client> GetClientAsync()
        {
            if (_supabaseClient != null) return _supabaseClient;

            var url = $"https://{Environment.GetEnvironmentVariable("SUPABASE_supabaseClient")}.supabase.co";
            var key = Environment.GetEnvironmentVariable("SUPABASE_PASS");

            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = true
            };

            _supabaseClient = new Client(url, key, options);

            try
            {
                await _supabaseClient.InitializeAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Supabase client: {ex.Message}");
                throw;
            }

            return _supabaseClient;
        }

        public async Task<MessagesResponse> GetUserMessages(string userId)
        {
            try
            {
                var client = await GetClientAsync();

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

        public async Task<MessagesResponse> SaveMessage(CreateMessageRequest request)
        {
            try
            {
                var client = await GetClientAsync();

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

        public async Task<MessagesResponse> ClearUserMessages(string userId)
        {
            try
            {
                var client = await GetClientAsync();

                await client
                    .From<Message>()
                    .Where(x => x.UserId == userId)
                    .Delete();

                // Add the starting message back
                var startingMessage = new CreateMessageRequest
                {
                    UserId = userId,
                    Text = "How can I help you today?",
                    Sender = "bot"
                };

                return await SaveMessage(startingMessage);
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

        public async Task<MessagesResponse> InitializeUserMessages(string userId)
        {
            try
            {
                // Check if user has any messages
                var existingMessages = await GetUserMessages(userId);

                if (existingMessages.Success && existingMessages.Messages.Count > 0)
                {
                    return existingMessages;
                }

                // If no messages, create the starting message
                var startingMessage = new CreateMessageRequest
                {
                    UserId = userId,
                    Text = "How can I help you today?",
                    Sender = "bot"
                };

                return await SaveMessage(startingMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error initializing user messages: {ex.Message}");
                return new MessagesResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }
    }
}

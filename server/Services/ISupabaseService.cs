using server.DTOs;
using Supabase;

namespace server.Services
{
    public interface ISupabaseService
    {
        Task<Client> GetClientAsync();

        Task<MessagesResponse> GetUserMessages(string userId);

        Task<MessagesResponse> SaveMessage(CreateMessageRequest request);

        Task<MessagesResponse> ClearUserMessages(string userId);

        Task<MessagesResponse> InitializeUserMessages(string userId);
    }
}
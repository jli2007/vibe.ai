using OpenAI.Chat;

namespace server.Services {
    public interface IOpenAIService
    {
        Task<ChatClient> GetClientAsync();
        Task<ChatCompletion> UseOpenAI(string text);
        Task<PlaylistSpec?> GeneratePlaylistSpecAsync(string prompt);
    }
}
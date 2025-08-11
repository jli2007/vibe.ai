using SpotifyAPI.Web;

namespace server.Services
{
    public interface ISpotifyService
    {
        Task<PrivateUser> GetCurrentUserProfileAsync(string accessToken);
        // Create a playlist from a PlaylistSpec (resolves seeds -> Spotify recs -> creates playlist)
        Task<string?> CreatePlaylistFromSpecAsync(string accessToken, string userId, PlaylistSpec spec);

        // helper that gets raw recommended track URIs from a spec
        Task<List<string>> GetRecommendedTrackUrisAsync(string accessToken, PlaylistSpec spec);
    }
}
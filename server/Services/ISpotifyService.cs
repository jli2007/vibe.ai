using SpotifyAPI.Web;
using server.DTOS;

namespace server.Services
{
    public interface ISpotifyService
    {
        // Gets the current Users profile
        Task<PrivateUser> GetCurrentUserProfileAsync(string accessToken);

        // Create a playlist from a PlaylistSpec (resolves seeds -> Spotify recs -> creates playlist)
        Task<string?> CreatePlaylistFromSpecAsync(string accessToken, string userId, PlaylistSpec spec);

        // Helper that gets raw recommended track URIs from a spec
        Task<List<string>> GetRecommendedTrackUrisAsync(string accessToken, PlaylistSpec spec);

        // Fetch current Users playlists
        Task<Paging<FullPlaylist>> GetUserPlaylists(string accessToken);
    }
}
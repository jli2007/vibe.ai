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
        Task<Paging<FullPlaylist>> GetUserPlaylistsAsync(string accessToken);
        
        // Create a new playlist from OpenAI-generated song recommendations
        Task<string?> CreatePlaylistFromSongListAsync(string accessToken, string userId, string playlistName, List<SongRecommendation> songs, string? description = null);

        // Add selected songs to an existing playlist
        Task<bool> AddSongsToPlaylistAsync(string accessToken, string playlistId, List<SongRecommendation> songs);

        // Save individual songs to user's library (Liked Songs)
        Task<bool> SaveSongsToLikedSongsAsync(string accessToken, List<SongRecommendation> songs);

        // Get song previews with 30-second preview URLs and metadata
        Task<List<SongPreview>> GetSongPreviewsAsync(string accessToken, List<SongRecommendation> songs);
    }
}
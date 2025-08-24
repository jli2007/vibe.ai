using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SpotifyAPI.Web;
using server.DTOS;

namespace server.Services
{
    public class SpotifyService : ISpotifyService
    {
        public Task<SpotifyClient> GetClientAsync(string AccessToken)
        {
            var spotify = new SpotifyClient(AccessToken);
            return Task.FromResult(spotify);
        }

        public async Task<PrivateUser> GetCurrentUserProfileAsync(string accessToken)
        {
            if (string.IsNullOrWhiteSpace(accessToken)) throw new ArgumentException("accessToken is required");

            if (accessToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                accessToken = accessToken.Substring(7).Trim();

            var spotify = await GetClientAsync(accessToken);
            return await spotify.UserProfile.Current();
        }

        // 1. Create New Playlist - Enhanced version of your existing method
        public async Task<string?> CreatePlaylistFromSpecAsync(string accessToken, string userId, PlaylistSpec spec)
        {
            var spotify = await GetClientAsync(accessToken);

            // Create playlist
            var createRequest = new PlaylistCreateRequest(spec.Name ?? "New Playlist")
            {
                Public = false,
                Description = spec.Description ?? "Generated playlist"
            };
            var created = await spotify.Playlists.Create(userId, createRequest);
            if (created == null) return null;

            var playlistId = created.Id;
            if (playlistId == null) return null;

            // Get track URIs from your OpenAI-generated JSON
            var uris = await GetRecommendedTrackUrisAsync(accessToken, spec);

            // Add tracks if any were found
            if (uris != null && uris.Count > 0)
            {
                // Spotify allows max 100 tracks per request
                var batches = uris.Select((uri, index) => new { uri, index })
                                 .GroupBy(x => x.index / 100)
                                 .Select(g => g.Select(x => x.uri).ToList());

                foreach (var batch in batches)
                {
                    var addRequest = new PlaylistAddItemsRequest(batch);
                    await spotify.Playlists.AddItems(playlistId, addRequest);
                }
            }

            return created.Uri ?? created.Id;
        }

        // 2. Create playlist from OpenAI JSON song list
        public async Task<string?> CreatePlaylistFromSongListAsync(string accessToken, string userId, string playlistName, List<SongRecommendation> songs, string? description = null)
        {
            var spotify = await GetClientAsync(accessToken);

            // Create playlist
            var createRequest = new PlaylistCreateRequest(playlistName)
            {
                Public = false,
                Description = description ?? "AI-generated playlist"
            };
            var created = await spotify.Playlists.Create(userId, createRequest);
            if (created == null) return null;

            var playlistId = created.Id;
            if (playlistId == null) return null;

            // Search for each song and get Spotify URIs
            var uris = new List<string>();
            foreach (var song in songs)
            {
                var searchQuery = $"track:\"{song.Title}\" artist:\"{song.Artist}\"";
                var searchRequest = new SearchRequest(SearchRequest.Types.Track, searchQuery) { Limit = 1 };
                
                try
                {
                    var searchResult = await spotify.Search.Item(searchRequest);
                    if (searchResult?.Tracks?.Items != null && searchResult.Tracks.Items.Count > 0)
                    {
                        var track = searchResult.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(track.Uri))
                            uris.Add(track.Uri);
                        else if (!string.IsNullOrEmpty(track.Id))
                            uris.Add($"spotify:track:{track.Id}");
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue with other songs
                    Console.WriteLine($"Error searching for {song.Artist} - {song.Title}: {ex.Message}");
                }
            }

            // Add tracks in batches
            if (uris.Count > 0)
            {
                var batches = uris.Select((uri, index) => new { uri, index })
                                 .GroupBy(x => x.index / 100)
                                 .Select(g => g.Select(x => x.uri).ToList());

                foreach (var batch in batches)
                {
                    var addRequest = new PlaylistAddItemsRequest(batch);
                    await spotify.Playlists.AddItems(playlistId, addRequest);
                }
            }

            return created.ExternalUrls?["spotify"] ?? created.Uri ?? created.Id;
        }

        // 3. Add songs to existing playlist
        public async Task<bool> AddSongsToPlaylistAsync(string accessToken, string playlistId, List<SongRecommendation> songs)
        {
            var spotify = await GetClientAsync(accessToken);

            // Search for each song and get Spotify URIs
            var uris = new List<string>();
            foreach (var song in songs)
            {
                var searchQuery = $"track:\"{song.Title}\" artist:\"{song.Artist}\"";
                var searchRequest = new SearchRequest(SearchRequest.Types.Track, searchQuery) { Limit = 1 };
                
                try
                {
                    var searchResult = await spotify.Search.Item(searchRequest);
                    if (searchResult?.Tracks?.Items != null && searchResult.Tracks.Items.Count > 0)
                    {
                        var track = searchResult.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(track.Uri))
                            uris.Add(track.Uri);
                        else if (!string.IsNullOrEmpty(track.Id))
                            uris.Add($"spotify:track:{track.Id}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error searching for {song.Artist} - {song.Title}: {ex.Message}");
                }
            }

            // Add tracks in batches
            if (uris.Count > 0)
            {
                try
                {
                    var batches = uris.Select((uri, index) => new { uri, index })
                                     .GroupBy(x => x.index / 100)
                                     .Select(g => g.Select(x => x.uri).ToList());

                    foreach (var batch in batches)
                    {
                        var addRequest = new PlaylistAddItemsRequest(batch);
                        await spotify.Playlists.AddItems(playlistId, addRequest);
                    }
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error adding songs to playlist: {ex.Message}");
                    return false;
                }
            }

            return false;
        }

        // 4. Save individual songs to user's Liked Songs
        public async Task<bool> SaveSongsToLikedSongsAsync(string accessToken, List<SongRecommendation> songs)
        {
            var spotify = await GetClientAsync(accessToken);

            // Search for each song and get Spotify track IDs
            var trackIds = new List<string>();
            foreach (var song in songs)
            {
                var searchQuery = $"track:\"{song.Title}\" artist:\"{song.Artist}\"";
                var searchRequest = new SearchRequest(SearchRequest.Types.Track, searchQuery) { Limit = 1 };
                
                try
                {
                    var searchResult = await spotify.Search.Item(searchRequest);
                    if (searchResult?.Tracks?.Items != null && searchResult.Tracks.Items.Count > 0)
                    {
                        var track = searchResult.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(track.Id))
                            trackIds.Add(track.Id);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error searching for {song.Artist} - {song.Title}: {ex.Message}");
                }
            }

            // Save tracks in batches (max 50 per request)
            if (trackIds.Count > 0)
            {
                try
                {
                    var batches = trackIds.Select((id, index) => new { id, index })
                                         .GroupBy(x => x.index / 50)
                                         .Select(g => g.Select(x => x.id).ToList());

                    foreach (var batch in batches)
                    {
                        var saveRequest = new LibrarySaveTracksRequest(batch);
                        await spotify.Library.SaveTracks(saveRequest);
                    }
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error saving songs to library: {ex.Message}");
                    return false;
                }
            }

            return false;
        }

        // 5. Get song previews (30-second preview URLs)
        public async Task<List<SongPreview>> GetSongPreviewsAsync(string accessToken, List<SongRecommendation> songs)
        {
            var spotify = await GetClientAsync(accessToken);
            var previews = new List<SongPreview>();

            foreach (var song in songs)
            {
                var searchQuery = $"track:\"{song.Title}\" artist:\"{song.Artist}\"";
                var searchRequest = new SearchRequest(SearchRequest.Types.Track, searchQuery) { Limit = 1 };
                
                try
                {
                    var searchResult = await spotify.Search.Item(searchRequest);
                    if (searchResult?.Tracks?.Items != null && searchResult.Tracks.Items.Count > 0)
                    {
                        var track = searchResult.Tracks.Items[0];
                        previews.Add(new SongPreview
                        {
                            Title = track.Name,
                            Artist = string.Join(", ", track.Artists.Select(a => a.Name)),
                            PreviewUrl = track.PreviewUrl,
                            SpotifyUrl = track.ExternalUrls?["spotify"],
                            AlbumImageUrl = track.Album?.Images?.FirstOrDefault()?.Url,
                            Duration = track.DurationMs,
                            TrackId = track.Id
                        });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error getting preview for {song.Artist} - {song.Title}: {ex.Message}");
                }
            }

            return previews;
        }

        // Get Recommended Tracks
        public async Task<List<string>> GetRecommendedTrackUrisAsync(string accessToken, PlaylistSpec spec)
        {
            var spotify = await GetClientAsync(accessToken);
            var uris = new List<string>();

            // Resolve seed track names to URIs via Search
            if (spec.SeedTracks != null)
            {
                foreach (var t in spec.SeedTracks)
                {
                    if (string.IsNullOrWhiteSpace(t)) continue;
                    var searchRequest = new SearchRequest(SearchRequest.Types.Track, t) { Limit = 1 };
                    var search = await spotify.Search.Item(searchRequest);

                    if (search?.Tracks?.Items != null && search.Tracks.Items.Count > 0)
                    {
                        var found = search.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(found.Uri)) uris.Add(found.Uri);
                        else if (!string.IsNullOrEmpty(found.Id)) uris.Add("spotify:track:" + found.Id);
                    }
                }
            }

            // If no track seeds found, try to get 1 track per seed artist
            if (uris.Count == 0 && spec.SeedArtists != null)
            {
                foreach (var a in spec.SeedArtists)
                {
                    if (string.IsNullOrWhiteSpace(a)) continue;

                    var artistTrackSearch = await spotify.Search.Item(
                        new SearchRequest(SearchRequest.Types.Track, $"artist:{a}") { Limit = 1 }
                    );

                    if (artistTrackSearch?.Tracks?.Items != null && artistTrackSearch.Tracks.Items.Count > 0)
                    {
                        var found = artistTrackSearch.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(found.Uri)) uris.Add(found.Uri);
                        else if (!string.IsNullOrEmpty(found.Id)) uris.Add("spotify:track:" + found.Id);
                    }
                }
            }

            return uris;
        }

        // Get User Playlists
        public async Task<Paging<FullPlaylist>> GetUserPlaylistsAsync(string accessToken)
        {
            var spotify = await GetClientAsync(accessToken);
            return await spotify.Playlists.CurrentUsers();
        }
    }
}
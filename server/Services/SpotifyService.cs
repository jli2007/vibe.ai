using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SpotifyAPI.Web;

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
        
        public async Task<string?> CreatePlaylistFromSpecAsync(string accessToken, string userId, PlaylistSpec spec)
        {
            var spotify = await GetClientAsync(accessToken);

            // create playlist (requires proper scopes)
            var createRequest = new PlaylistCreateRequest(spec.Name ?? "New Playlist")
            {
                Public = false // CHANGED: example — set public/private as you need
            };
            var created = await spotify.Playlists.Create(userId, createRequest); // CHANGED
            if (created == null) return null;

            var playlistId = created.Id;

            if (playlistId == null) return null;

            // get track URIs (delegates to implemented helper)
            var uris = await GetRecommendedTrackUrisAsync(accessToken, spec);

            // add tracks if any were found
            if (uris != null && uris.Count > 0)
            {
                var addRequest = new PlaylistAddItemsRequest(uris); // CHANGED
                await spotify.Playlists.AddItems(playlistId, addRequest); // CHANGED: check response in prod
            }

            return created.Uri ?? created.Id;
        }

        public async Task<List<string>> GetRecommendedTrackUrisAsync(string accessToken, PlaylistSpec spec)
        {
            var spotify = await GetClientAsync(accessToken);

            var uris = new List<string>();

            // resolve seed track names (best-effort) to URIs via Search
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

            // if no track seeds found, try to get 1 track per seed artist (best-effort)
            if (uris.Count == 0 && spec.SeedArtists != null)
            {
                foreach (var a in spec.SeedArtists)
                {
                    if (string.IsNullOrWhiteSpace(a)) continue;

                    // CHANGED: search tracks by artist (best-effort). Note: advanced filters like "artist:" can be flaky in some cases.
                    var artistTrackSearch = await spotify.Search.Item( // CHANGED
                        new SearchRequest(SearchRequest.Types.Track, $"artist:{a}") { Limit = 1 } // CHANGED
                    );

                    if (artistTrackSearch?.Tracks?.Items != null && artistTrackSearch.Tracks.Items.Count > 0)
                    {
                        var found = artistTrackSearch.Tracks.Items[0];
                        if (!string.IsNullOrEmpty(found.Uri)) uris.Add(found.Uri);
                        else if (!string.IsNullOrEmpty(found.Id)) uris.Add("spotify:track:" + found.Id);
                    }
                }
            }

            // return whatever URIs we resolved (possibly empty)
            return await Task.FromResult(uris);
        }
    }
}

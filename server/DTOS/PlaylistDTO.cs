namespace server.DTOS
{
    public class TokenDTo
    {
        public string AccessToken { get; set; } = string.Empty;
    }

    public class PlaylistSpec
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string[]? SeedArtists { get; set; }
        public string[]? SeedTracks { get; set; }
        public string[]? SeedGenres { get; set; }
        public double? TargetTempo { get; set; }
        public double? TargetEnergy { get; set; }
        public double? TargetValence { get; set; }
        public double? TargetDanceability { get; set; }
        public int? Limit { get; set; }
        public string? Market { get; set; }
    }

    // For your OpenAI-generated song recommendations
    public class SongRecommendation
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? Album { get; set; }
        public string? Genre { get; set; }
        public int? Year { get; set; }
        public string? Reason { get; set; } // Why this song was recommended
    }

    // For song previews functionality
    public class SongPreview
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? PreviewUrl { get; set; } // 30-second preview URL
        public string? SpotifyUrl { get; set; } // Full Spotify track URL
        public string? AlbumImageUrl { get; set; }
        public int? Duration { get; set; } // Duration in milliseconds
        public string? TrackId { get; set; }
    }

    // For API responses
    public class SpotifyActionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? PlaylistId { get; set; }
        public string? PlaylistUrl { get; set; }
        public int? TracksAdded { get; set; }
    }
}
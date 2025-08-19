using System.ComponentModel.DataAnnotations;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace server.Models
{
    [Table("messages")]
    public class Message : BaseModel
    {
        [PrimaryKey("id")]
        public Guid Id { get; set; }

        [Column("user_id")]
        public string UserId { get; set; } = string.Empty;

        [Column("text")]
        [Required]
        public string Text { get; set; } = string.Empty;

        [Column("sender")]
        [Required]
        public string Sender { get; set; } = string.Empty; // "user" or "bot"

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
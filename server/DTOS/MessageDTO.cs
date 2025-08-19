namespace server.DTOs
{
    public class MessageDto
    {
        public string Text { get; set; } = string.Empty;
        public string Sender { get; set; } = string.Empty;
    }

    public class CreateMessageRequest
    {
        public string Text { get; set; } = string.Empty;
        public string Sender { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class MessagesResponse
    {
        public List<MessageDto> Messages { get; set; } = new();
        public bool Success { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}
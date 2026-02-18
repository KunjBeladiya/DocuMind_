import enum

class MessageRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class SummaryType(str, enum.Enum):
    SHORT = "SHORT"
    DETAILED = "DETAILED"
    BULLET = "BULLET"

class QuizDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class QuizStatus(str, enum.Enum):
    CREATED = "CREATED"
    COMPLETED = "COMPLETED"


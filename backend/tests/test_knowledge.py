from app.services.knowledge import chunk_text


def test_chunk_text_preserves_all_content() -> None:
    text = " ".join(f"word-{index}" for index in range(500))
    chunks = chunk_text(text, max_chars=200, overlap=20)
    assert len(chunks) > 1
    assert chunks[0].startswith("word-0")
    assert chunks[-1].endswith("word-499")


def test_chunk_text_empty() -> None:
    assert chunk_text("  \n ") == []


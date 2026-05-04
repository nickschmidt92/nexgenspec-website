from pydantic import BaseModel
from typing import TypeVar, Generic, Sequence

T = TypeVar("T")


class PaginationParams(BaseModel):
    limit: int = 50
    offset: int = 0


class PagedResponse(BaseModel, Generic[T]):
    items: Sequence[T]
    total: int
    limit: int
    offset: int

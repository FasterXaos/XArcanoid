import re

from werkzeug.security import check_password_hash, generate_password_hash

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")


def is_valid_username(username):
    return isinstance(username, str) and bool(USERNAME_RE.fullmatch(username))


def is_valid_password(password):
    return isinstance(password, str) and 4 <= len(password) <= 64


def hash_password(password):
    return generate_password_hash(password)


def password_matches(password_hash, password):
    return check_password_hash(password_hash, password)

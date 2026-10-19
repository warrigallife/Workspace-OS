def solve(value):
    seen = set()
    result = []
    for item in value:
        if item not in seen:
            result.append(item)
            seen.add(item)
    return result
def solve(value):
    total = 0
    for num in value:
        if num.isdigit():
            total += int(num)
    return total if total else 0
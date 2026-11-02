import sys

# Ensure both 'Newsroom' and 'newsroom' module paths resolve to this package
sys.modules.setdefault('newsroom', sys.modules[__name__])


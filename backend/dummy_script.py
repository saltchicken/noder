import time
import sys
import random

print("Starting the dummy script.")
# sys.stdout.flush() # Ensure output is sent immediately
time.sleep(1)

print("Processing item 1...")
# sys.stdout.flush()
time.sleep(1.5)

print("WARNING: Item 2 might need attention.")
# sys.stdout.flush()
time.sleep(1)

print("Processing item 3...")
# sys.stdout.flush()
time.sleep(0.5)

if random.random() < 0.5:
    print("ERROR: A simulated error occurred!", file=sys.stderr)
    # sys.stderr.flush()
    time.sleep(0.5)
    # sys.exit(1) # Optional: exit with error code

print("Script finished normally.")
# sys.stdout.flush()

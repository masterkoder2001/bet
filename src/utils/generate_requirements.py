import json

def generate_requirements():
    requirements = [
        "finnhub-python==2.4.18",
        "trafilatura==2.0.0",
        "twilio==9.4.5"
    ]

    with open('requirements.txt', 'w') as f:
        f.write('\n'.join(requirements))

if __name__ == '__main__':
    generate_requirements()
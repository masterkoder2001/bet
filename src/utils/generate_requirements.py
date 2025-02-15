import pkg_resources
import json

def generate_requirements():
    packages = [
        str(pkg) for pkg in pkg_resources.working_set
        if pkg.key in ['finnhub-python']
    ]
    with open('requirements.txt', 'w') as f:
        f.write('\n'.join(packages))

if __name__ == '__main__':
    generate_requirements()

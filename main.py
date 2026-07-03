from flask import Flask

app = Flask(__name__)


@app.route("/")
def health_check():
    return "OK", 200


def main():
    print("Hello from repl-nix-workspace!")
    app.run(host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()

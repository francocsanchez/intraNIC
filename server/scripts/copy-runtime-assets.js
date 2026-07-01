const fs = require("fs");
const path = require("path");

const serverRoot = path.resolve(__dirname, "..");

const copies = [
  {
    from: path.join(serverRoot, "src", "pdf", "minutas", "minutaPdfStyles.css"),
    to: path.join(serverRoot, "dist", "pdf", "minutas", "minutaPdfStyles.css"),
  },
];

copies.forEach(({ from, to }) => {
  if (!fs.existsSync(from)) {
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
});

// api/parse.js — Vercel Serverless Function (Node 22, CJS)
const fs = require("fs");
const formidable = require("formidable");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false, maxFileSize: 20 * 1024 * 1024 }); // 20MB

  form.parse(req, async (err, _fields, files) => {
    if (err) return res.status(400).json({ error: "Invalid form" });

    const file = files.file || files.resume || Object.values(files || {})[0];
    if (!file) return res.status(400).json({ error: "No file provided" });

    try {
      let text = "";
      const name = file.originalFilename || file.newFilename || file.filepath;
      const mime = file.mimetype || "";

      if (mime === "application/pdf" || /\.pdf$/i.test(name)) {
        const buf = fs.readFileSync(file.filepath);
        const data = await pdfParse(buf);
        text = (data.text || "").trim();
      } else if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        /\.docx$/i.test(name)
      ) {
        const { value } = await mammoth.extractRawText({ path: file.filepath });
        text = (value || "").trim();
      } else if (mime.startsWith("text/") || /\.txt$/i.test(name)) {
        text = fs.readFileSync(file.filepath, "utf8");
      } else {
        return res.status(415).json({ error: "Unsupported file type" });
      }

      if (!text) return res.status(422).json({ error: "Failed to extract text" });

      return res.status(200).json({
        ok: true,
        text,
        meta: { filename: name, size: file.size || 0, type: mime },
      });
    } catch (e) {
      return res.status(500).json({ error: "Parse failure", detail: e.message });
    } finally {
      if (file?.filepath) fs.unlink(file.filepath, () => {});
    }
  });
};

express = require("express");
app = express();

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"))
app.get(["/index", "/home"], function (req, res) {
    res.render("pagini/index.ejs",{ip:req.ip});
}
)

app.get("/*", function (req, res) {
    res.render("pagini" + req.url, function (err, rezRender) {
        if (err) {
            if (err.message.includes("Failed to lookup view")) {
                res.status(404).render("pagini/404");
            }
            else {
                res.render("pagini/eroare_generala");
            }
        }
        else {
            res.send(rezRender);
        }
    });

    res.end();
})

app.listen(8080);
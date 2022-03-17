const express = require("express");
const fs=require("fs");
const sharp=require("sharp");
app = express();

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"))
app.get(["/","/index", "/home"], function (req, res) {
    res.render("pagini/index.ejs",{ip:req.ip,imagini:obImagini.imagini});
}
)

app.get("/*.ejs",function(req,res){
    res.status(403).render("pagini/403.ejs");
})

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


function creeazaImagini(){
    var buf=fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf8");
    obImagini=JSON.parse(buf);//global
    //console.log(obImagini);
    for (let imag of obImagini.imagini){
        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.fisier.split(".")// "abc.de".split(".") ---> ["abc","de"]
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        imag.mare=`${obImagini.cale_galerie}/${imag.fisier}`;

        if (!fs.existsSync(imag.mic)){
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);
        }

        let dim_mediu=300
        imag.mediu=`${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png` 
        if (!fs.existsSync(imag.mediu)){
            sharp(__dirname+"/"+imag.mare).resize(dim_mediu).toFile(__dirname+"/"+imag.mediu);
        }
    }

}


creeazaImagini();
app.listen(8080);
window.addEventListener("load", function () {
    document.getElementById("inp-pret-min").onchange=function(){
        this.value=Math.min(this.value,document.getElementById("inp-pret-max").value);
        document.getElementById("infoRangeMin").innerHTML=" ("+this.value+")"
    }

    document.getElementById("inp-pret-max").onchange=function(){
        this.value=Math.max(this.value,document.getElementById("inp-pret-min").value);
        document.getElementById("infoRangeMax").innerHTML=" ("+this.value+")"
    }

    document.getElementById("filtrare").onclick = function () {
        var tokensNume= document.getElementById("inp-nume").value.toLowerCase().split('*');


        var butoaneRadio=document.getElementsByName("gr_rad");

        var autori=document.getElementById("inp-authors");
        var autoriSelectati=[];
        for(let autor of autori.options){
            if(autor.selected){
                autoriSelectati.push(autor.value);
            }
        }

        for(let rad of butoaneRadio){
            if(rad.checked){
                var valPag=rad.value;
                break;
            }
        }


        var minPag,maxPag;
        if(valPag!="toate"){
            [minPag,maxPag]=valPag.split(":");
            minPag=parseInt(minPag);
            maxPag=parseInt(maxPag);
        }
        else{
            minPag=0;
            maxPag=10000000;
        }
        var valPretMin=document.getElementById("inp-pret-min").value;
        var valPretMax=document.getElementById("inp-pret-max").value;
        var valCategorie=document.getElementById("inp-categorie").value;
        var articole = document.getElementsByClassName("produs");


        for (let art of articole) {
            art.style.display = 'none';
            let numeArt = art.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase();
            let cond1 = (!tokensNume[0] || numeArt.startsWith(tokensNume[0])) && (!tokensNume[1] || numeArt.endsWith(tokensNume[1]));
            console.log(numeArt,cond1);
            let paginiArt= parseInt(art.getElementsByClassName("val-pagini")[0].innerHTML);
            let cond2=(minPag<=paginiArt&& paginiArt<maxPag);

            let pretArt=parseInt(art.getElementsByClassName("val-pret")[0].innerHTML);
            let cond3=(pretArt>=valPretMin) && (pretArt<=valPretMax);

            let categorieArt=art.getElementsByClassName("val-subcategorie")[0].innerHTML;
            let cond4=(valCategorie=="toate") || categorieArt==valCategorie;

            let autorArt=art.getElementsByClassName("val-autor")[0].innerHTML;
            let cond5=autoriSelectati.includes(autorArt) || autoriSelectati.includes("Toti");

            let conditieFinala = cond1 && cond2 && cond3 && cond4 && cond5;
            if(conditieFinala){
                art.style.display='block';
            }
        }
    }

    document.getElementById("resetare").onclick=function(){
        var articole = document.getElementsByClassName("produs");
        for (let art of articole) {
            art.style.display='block';
        }
        document.getElementById("inp-nume").value="";
        document.getElementById("i_rad4").checked=true;
        document.getElementById("inp-pret-min").value=document.getElementById("inp-pret-min").min;
        document.getElementById("inp-pret-max").value=document.getElementById("inp-pret-max").max;
        document.getElementById("infoRangeMin").innerHTML=" ("+document.getElementById("inp-pret-min").value+")"
        document.getElementById("infoRangeMax").innerHTML=" ("+document.getElementById("inp-pret-max").value+")"
        document.getElementById("sel-toate").selected=true;

        var autori=document.getElementById("inp-authors");
        for(let autor of autori.options){
            autor.selected=false;
        }
        autori[0].selected=true;

    }

    function sorteazaSemn(semn){
        var articole = Array.from(document.getElementsByClassName("produs"));
        articole.sort(function(a,b){
            
            let nume_a= a.getElementsByClassName("val-nume")[0].innerHTML;
            let nume_b= b.getElementsByClassName("val-nume")[0].innerHTML;
            if(nume_a!=nume_b){
                return semn*nume_a.localeCompare(nume_b);
            }
            else{

                let lungime_a= a.getElementsByClassName("val-descriere")[0].innerHTML.length;
                let lungime_b= b.getElementsByClassName("val-descriere")[0].innerHTML.length;
                return semn*(lungime_a-lungime_b);
            }
         })

         for(let art of articole){
             art.parentNode.appendChild(art);
         }
    }

    document.getElementById("sortCrescNume").onclick=function(){
        sorteazaSemn(1);
    }

    document.getElementById("sortDescrescNume").onclick=function(){
        sorteazaSemn(-1);
    }

    document.getElementById("calcul").onclick = function () {
        let p_vechi=document.getElementById("psuma");
        if(!p_vechi){
            let sum=0;
            var articole = Array.from(document.getElementsByClassName("produs"));
            for(let art of articole){
                if(art.style.display!="none"){
                    sum+=parseFloat(art.getElementsByClassName("val-pret")[0].innerHTML);
                }
            }
            var p=document.createElement("p");
            p.innerHTML=sum;
            p.id="psuma";
            var sectiune=document.getElementById("produse");
            sectiune.parentElement.insertBefore(p,sectiune);
            setTimeout(function(){
                let p_vechi=document.getElementById("psuma");
                if(p_vechi){
                    p_vechi.remove();
                }
            },2000)
    }
    }
    var checkboxuri=document.getElementsByClassName("select-cos");
    for(let ch of checkboxuri){
        ch.onchange=function(){
            if(this.checked){//cos_virtual=>"1,5,2..."
                iduriProduse=localStorage.getItem("cos_virtual")
                if(iduriProduse){
                    iduriProduse.split(',')
                }
                else{
                    iduriProduse=[];
                }
                iduriProduse.push(this.value);
                localStorage.setItem("cos_virtual",iduriProduse.join(","));
            } 
        }
    }
})
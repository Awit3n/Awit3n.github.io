// Exemple d’initiation dynamique si tu veux charger les blocs depuis un tableau
const data = [
    { image: "image1.jpg", nom: "Sophie Rain", lien: "https://mega.nz/folder/UUpk2JRS#hVLYMeF1yyACDeh3OREuIw/folder/wQBHAbwI" },
    { image: "image5.jpg", nom: "Jamelizzz", lien: "https://bunkr.si/a/BzqgJI73" },
    { image: "image2.jpg", nom: "Zoe Moore", lien: "https://mega.nz/folder/4u5SxAoD#aTI9o7gPEggsbMI7vHkUiw#" },
    { image: "image3.jpg", nom: "Hannahowo", lien: "https://mega.nz/folder/gcdwBLiJ#1bBRKW4rWyCLlVuU65vu7A" },
    { image: "image4.jpg", nom: "Redhead.grilnextdoor", lien: "https://mega.nz/folder/INcgnJbQ#vdmhnAixJ0-swHmKqazDWA" },
    
  ];
  
  const gallery = document.querySelector(".gallery");

  if (gallery && data.length) {
    gallery.innerHTML = data
      .map(
        (item) => `
        <div class="card">
          <div class="image-container">
            <img src="${item.image}" alt="${item.nom}">
          </div>
          <div class="card-content">
            <h2>${item.nom}</h2>
            <a href="${item.lien}" class="glass-btn">See The Content</a>
          </div>
        </div>
      `
      )
      .join("");
  }

  


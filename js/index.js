document.addEventListener("DOMContentLoaded", function() {
    var imagens = [
      "../public/1.jpg",
      "../public/2.jpg",
      "../public/3.jpg",
      "../public/4.jpg",
      "../public/5.jpg",
      "../public/6.jpg",
      "../public/7.jpg"
    ];
    
    var div = document.getElementById("logo");
    var index = 0;
    
    function alterarImagemDeFundo() {
      div.classList.add("fade-out");
      setTimeout(function() {
        div.style.backgroundImage = "url(" + imagens[index] + ")";
        div.classList.remove("fade-out");
        index = (index + 1) % imagens.length;
      }, 500);
    }
    
    alterarImagemDeFundo();
    setInterval(alterarImagemDeFundo, 5000);
  });
  
  var scrollButtons = document.getElementsByClassName('scroll-button');

  for (var i = 0; i < scrollButtons.length; i++) {
    scrollButtons[i].addEventListener('click', function() {
      var target = this.getAttribute('data-target');
      var targetDiv = document.getElementById(target);
      targetDiv.scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    var header = document.getElementById("header");
    var logo = document.getElementById("logo");

    function handleScroll() {
        var logoRect = logo.getBoundingClientRect();
        var logoBottom = logoRect.bottom;

        if (logoBottom <= 100) {
            header.classList.add("visible");
        } else {
            header.classList.remove("visible");
        }
    }

    window.addEventListener("scroll", handleScroll);
});
function adicionarContato() {
  const numeroTelefone = "seu_numero_de_telefone";
  window.location.href = `tel:${numeroTelefone}`;
}
//Función corrección
//sonido salto
//distintos tipos de fricción (cambiar a mano)
//editor a tiempo real (ratón para poner obstáculos)


var canvas;
var ctx;
var FPS = 50;

//DIMENSIONES DE LAS CASILLAS
var anchoF = 50;
var altoF = 50;

//COLORES
var muro = '#044f14';
var tierra = '#c6892f';

//CARGA DEL SONIDO
var sonido = new Howl({
  src: ['sound/efecto2.wav'],
 onload: function() {
 },
  loop: false
});





var protagonista;

var escenario = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,2,2,0,0,2,2,0,0,0,0,2,2,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,2,2,2,2,2,2,0,2,2,0,0,0,0,0],
  [0,2,2,2,2,2,0,0,0,2,2,2,2,2,0],
  [0,0,0,2,2,0,0,0,0,0,2,2,0,2,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];



function dibujaEscenario(){
  var color;

  for(y=0;y<10;y++){
    for(x=0;x<15;x++){

      if(escenario[y][x]==0)
        color = muro;

      if(escenario[y][x]==2)
        color = tierra;

      ctx.fillStyle = color;
      ctx.fillRect(x*anchoF,y*altoF,anchoF,altoF);
    }
  }
}





//OBJETO JUGADOR
var jugador = function(){

  //Posición en pixels
  this.x = 70;
  this.y = 70;

  //Velocidad horizontal y vertical
  this.vx = 0;
  this.vy = 0;

  //Gravedad
  this.gravedad = 0.3;    //lunar = 0.3   normal = 0.5
  this.friccion = 0.1;    //sin fricción = 0   hielo = 0.1   suelo = 0.2


  this.salto = 10;     //salto = 10
  this.velocidad = 3;  //desplazamiento = 3

  //¿Está en el suelo?
  this.suelo = false;

  //controlamos la pulsación de las teclas
  this.pulsaIzquierda = false;
  this.pulsaDerecha = false;


  this.durezaRebote = 100;  //flexible = 2  noFlexible = 100
  this.color = '#820c01';




  //CORREGIMOS LA POSICION DEL JUGADOR A UNA CASILLA (SIN DEJAR HUECOS)
  this.correccion = function(lugar){

    if(lugar == 1){
      this.y = parseInt(this.y/altoF)*altoF;
      console.log('abajo');
    }

    if(lugar == 2){
      this.y = (parseInt(this.y/altoF)+1)*altoF;
      console.log('arriba');
    }


    if(lugar == 3){
      this.x = (parseInt(this.x/anchoF))*anchoF;
      console.log('izquierda');
    }

    if(lugar == 4){
      this.x = parseInt((this.x/anchoF)+1)*anchoF;
      console.log('derecha');
    }


  }





  //HACEMOS LOS CÁLCULOS OPORTUNOS
  this.fisica = function(){

    //CAÍDA
    if(this.suelo == false){
      this.vy += this.gravedad;
    }
    else{
      this.correccion(1);

      //AÑADIMOS
      var rebote = parseInt(this.vy/this.durezaRebote);
      this.vy = 0 - rebote;
    }


    //VELOCIDAD HORIZONTAL
    //Siempre la refrescamos, para que pueda haber inercia y deslice
    if(this.pulsaIzquierda == true){
      this.vx = -this.velocidad;
    }

    if(this.pulsaDerecha == true){
      this.vx = this.velocidad;
    }



    //FRICCÓN (INERCIA)
    //Izquierda
    if(this.vx < 0){
      this.vx += this.friccion;

      //si nos pasamos, paramos
      if(this.vx >0){
        this.vx = 0;
      }
    }

    //Derecha
    if(this.vx > 0){
      this.vx -= this.friccion;

      //si nos pasamos, paramos
      if(this.vx < 0){
        this.vx = 0;
      }
    }



    //VEMOS SI HAY COLISIÓN POR LOS LADOS
    //SOLO HACEMOS LA CORRECCIÓN SI LA FICHA NO ESTÁ ENCAJADA EN EL PUNTO EXACTO
    //DEJAMOS UN PIXEL POR LOS LADOS, PARA QUE NO QUEDE JUSTO EN LA PRÓXIMA CASILLA Y SE BLOQUEE

    //derecha
    if(this.vx > 0){
      if(this.colision(this.x + anchoF + this.vx,(this.y + 1))==true || this.colision(this.x + anchoF + this.vx,(this.y + altoF - 1))==true){
        if(this.x != parseInt(this.x/anchoF)*anchoF){
          this.correccion(4)
        }

        this.vx = 0;
      }
    }


    //Izquierda
    if(this.vx < 0){
      if(this.colision(this.x + this.vx,(this.y+ 1))==true || this.colision(this.x + this.vx,(this.y+ + altoF - 1))==true){
        this.correccion(3)
        this.vx = 0;
      }
    }


    //ACTUALIZAMOS POSICIÓN
    this.y += this.vy;
    this.x += this.vx;


    //para ver si hay colisión por abajo le sumamos 1 casilla a "y"
    //COMPROBAMOS 2 PUNTOS EN PANTALLA Y NOS ASEGURAMOS DE QUE NO ESTÁ SALTANDO (velocidad vertical mayor o igual que cero)
    if(this.vy >= 0){
      if((this.colision((this.x + 1),(this.y + altoF))==true) || (this.colision((this.x + anchoF - 1),(this.y + altoF))==true)){
        this.suelo = true;
      }
      else{
        this.suelo = false;
      }
    }


    //COMPROBAMOS COLISIÓN CON EL TECHO (frena el ascenso en seco)
    //if(this.colision((this.x+ (parseInt(anchoF/2))), this.y)){
    if((this.colision((this.x + 1), this.y) == true) || (this.colision((this.x + anchoF - 1), this.y) == true)){
      this.correccion(2);
      this.vy = 0;

    }


  }




  this.dibuja = function(){

    this.fisica();

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x,this.y,anchoF,altoF);
  }


  this.colision = function(x,y){
    var colisiona = false;

    //Ajustamos los pixels a los cuadros dividiendo por altoF y anchoF
    //if(escenario[y][x]==0){
    if(escenario[parseInt(y/altoF)][parseInt(x/anchoF)]==0){
      colisiona = true;
    }

    return(colisiona);
  }



  this.arriba = function(){

    //Solo podemos saltar si estamos en el suelo
    if(this.suelo == true){
      this.vy -= this.salto;
      this.suelo = false;
      //sonido.play();
    }
  }



  this.izquierda = function(){
    //this.vx = -this.velocidad;
    this.pulsaIzquierda = true;
  }

  this.derecha = function(){
    //this.vx = this.velocidad;
    this.pulsaDerecha = true;
  }


  this.izquierdaSuelta = function(){
    this.pulsaIzquierda = false;
  }

  this.derechaSuelta = function(){
    this.pulsaDerecha = false;
  }



this.creaBloque = function(x,y){
  xBloque = parseInt(x/anchoF);
  yBloque = parseInt(y/altoF);
  colorBloque = escenario[yBloque][xBloque];

  if(colorBloque == 0){
    colorBloque = 2;
  }
  else {
    colorBloque = 0;
  }

  escenario[yBloque][xBloque] = colorBloque;

}




this.previewBloque = function(){
  ctx.fillStyle = '#666666';
  ctx.fillRect(parseInt(ratonX/anchoF)*anchoF,parseInt(ratonY/altoF)*altoF,anchoF,altoF);
}




}





//----------------------------------------------------

var ratonX = 0;
var ratonY = 0;

function clicRaton(e){
  console.log('raton pulsado');
}

function sueltaRaton(e){
  protagonista.creaBloque(ratonX,ratonY);
}

function posicionRaton(e){
  ratonX = e.pageX;
  ratonY = e.pageY;
}


//-----------------------------------------------------

function inicializa(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  //CREAMOS AL JUGADOR
  protagonista = new jugador();


  //RATÓN
  canvas.addEventListener('mousedown',clicRaton,false);
  canvas.addEventListener('mouseup',sueltaRaton,false);
  canvas.addEventListener('mousemove',posicionRaton,false);


  //LECTURA DEL TECLADO
  document.addEventListener('keydown',function(tecla){

    if(tecla.keyCode == 38){
      protagonista.arriba();
    }

    if(tecla.keyCode == 37){
      protagonista.izquierda();
    }

    if(tecla.keyCode == 39){
      protagonista.derecha();
    }

  });



  //LECTURA DEL TECLADO
  document.addEventListener('keyup',function(tecla){

    if(tecla.keyCode == 37){
      protagonista.izquierdaSuelta();
    }

    if(tecla.keyCode == 39){
      protagonista.derechaSuelta();
    }

  });



  setInterval(function(){
    principal();
  },1000/FPS);
}


function borraCanvas(){
  canvas.width=750;
  canvas.height=500;
}


function principal(){
  borraCanvas();
  dibujaEscenario();
  protagonista.previewBloque();
  protagonista.dibuja();
}

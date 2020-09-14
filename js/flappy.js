function newElement(tagName, className) {
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

function Barrier(reverse = false) {
    this.element = newElement('div', 'barreira')

    const border = newElement('div', 'borda')
    const body = newElement('div', 'corpo')
    this.element.appendChild(reverse ? body : border)
    this.element.appendChild(reverse ? border : body)

    this.setHeight = h => body.style.height = `${h}px`
}

function PairOfBarriers(height, gap, x){
    this.element = newElement('div', 'par-de-barreiras')

    this.higher = new Barrier(true)
    this.lower = new Barrier(false)

    this.element.appendChild(this.higher.element)
    this.element.appendChild(this.lower.element)

    //Irá calcular o tamanho da abertura dos canos de forma aleatória, pois a mesma não pode ter tamanho fixo durante o jogo. 
    //A abetura é determinada pela diferença entre a altura do cano superior gerada aleatoriamente com a altura do cano inferior (altura da tela do jogo - tamanho fixo da abertura - altura do cano superior)
    this.randomGaps = () => {
        const topHeight = Math.random() * (height - gap) //Obtendo a altura do corpo do cano superior aleatoriamente
        const bottomHeight = height - gap - topHeight
        this.higher.setHeight(topHeight)
        this.lower.setHeight(bottomHeight)
    }

    //Obtendo a posição atual dos canos no eixo x para ser utilizado posteriormente na animação
    this.getX = () => parseInt(this.element.style.left.split('px')[0]) 

    //A qualquer momento o jogo terá que alterar a posição X dos canos, para dar efeito de animação
    this.setX = x => this.element.style.left = `${x}px` 
    
    this.getWidth = () => this.element.clientWidth

    this.randomGaps()
    this.setX(x)
}

function Barriers(height, width, gap, space, addPoint){
    this.pairs = [
        new PairOfBarriers(height, gap, width),
        new PairOfBarriers(height, gap, width + space),
        new PairOfBarriers(height, gap, width + space * 2),
        new PairOfBarriers(height, gap, width + space * 3),
    ]

    const offset = 3

    this.animate = () => {
        this.pairs.forEach(pair => {
            pair.setX(pair.getX() - offset)

            //Quando um par de canos sair do jogo (pelo lado esquerdo da tela), será deslocado até o final da tela (no lado direito) até surgirem novamente.
            if(pair.getX() < -pair.getWidth()){
                pair.setX(pair.getX() + space * this.pairs.length)
                pair.randomGaps() //À medida que os canos resurgem, os mesmos devem aparecem com posições diferentes, de maneira aleatória, para evitar que apareçam sempre os mesmos canos (no sentido de aparecerem sempre com as mesmas posições)   
            }

            const middle = width / 2
            const crossedTheMiddle = pair.getX() + offset >= middle && pair.getX() < middle

            if(crossedTheMiddle) addPoint()
        })
    }
}

function Bird(gameScreenHeight){
    let flying = false

    this.element = newElement('img', 'passaro')
    this.element.src = 'imgs/passaro.png'

    //No pássaro, é preciso animar só no eixo y
    //Obtendo a posição atual do pássaro no eixo y
    this.getY = () => parseInt(this.element.style.bottom.split('px')[0])
    this.setY = y => this.element.style.bottom = `${y}px`

    window.onkeydown = e => flying = true
    window.onkeyup = e => flying = false

    this.animate = () => {
        const newY = this.getY() + (flying ? 8 : -5)
        const maxHeight = gameScreenHeight - this.element.clientHeight

        //Testando a colisão com a altura da tela do jogo (viewport), evitando que passe por fora
        if(newY <= 0){
            this.setY(0)
        }
        else if(newY > maxHeight){
            this.setY(maxHeight)
        }
        else{
            this.setY(newY)
        }
    }

    this.setY(gameScreenHeight / 2) //Posição inicial do pássaro
}

function Progress(){
    this.element = newElement('span', 'progresso')

    this.updatePoints = points => {
        this.element.innerHTML = points
    }

    this.updatePoints(0)
}

function overlapped(elementA, elementB){
    const a = elementA.getBoundingClientRect()
    const b = elementB.getBoundingClientRect()

    //Verificando se os dois elementos irão colidir (se estão sobrepostos em relação a um determinado eixo)
    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left //Eixo x
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top //Eixo y

    return horizontal && vertical
}

function collided(bird, barriers){
    let collided = false

    barriers.pairs.forEach(pair => {
        if(!collided){
            const higher = pair.higher.element
            const lower = pair.lower.element

            collided = overlapped(bird.element, higher) || overlapped(bird.element, lower)
        }
    })    

    return collided
}

function FlappyBird(){
    let points = 0

    const gameScreen = document.querySelector('[wm-flappy]')
    const height = gameScreen.clientHeight
    const width = gameScreen.clientWidth

    const progress = new Progress()
    const barriers = new Barriers(height, width, 200, 400, () => progress.updatePoints(++points))
    const bird = new Bird(height)

    gameScreen.appendChild(progress.element)
    gameScreen.appendChild(bird.element)
    
    barriers.pairs.forEach(pair => gameScreen.appendChild(pair.element))

    this.start = () => {        
        const timer = setInterval(() =>{
            barriers.animate()
            bird.animate()

            if(collided(bird, barriers)){
                clearInterval(timer)
            }
        }, 20)
    }
}


new FlappyBird().start()


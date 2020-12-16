const starTexture = PIXI.Texture.from('https://pixijs.io/examples/examples/assets/star.png');
const humanCannonTexture = PIXI.Texture.from('/img/human-cannon.png');

const bulletHeight = 15;
const numberOfInvadersRows = 5;
const starAmount = 1000;
const bulletSpeed = 10;
const fov = 20;
const baseSpeed = 0.025;
const starStretch = 5;
const starBaseSize = 0.05;
const humanSpaceshipMinimumShootingInterval = 500;
const stars = [];
const aliens = [];
const alienHitboxes = [];
const bullets = [];
const alienTextures = [];
const humanCannonSprite = new PIXI.Sprite(humanCannonTexture);
const bulletGraphic = new PIXI.Graphics().beginFill(0xFFFFFF).drawRect(100, 100, 2, bulletHeight).endFill();
const pixelsToGameBorder = (window.innerWidth - 600) / 2;
let backgroundSpeed = 0;
let cameraZ = 0;
let alienShipShootingInterval = 500;
let lastBulletShootTimestamp = Date.now();
let lastAlienBulletShootTimestamp = Date.now();
let alienSound;
let cannonSound = PIXI.sound.Sound.from({
    url: '/sounds/shoot.wav',
    preload: true,
    volume: 0.1
})

const getNewApp = function () {
    return new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        resolution: 1,
    });
}

const app = getNewApp();
const bulletTexture = app.renderer.generateTexture(bulletGraphic);

const getBulletSprite = function () {
    return new PIXI.Sprite(bulletTexture);
}

const initSounds = function () {

    let firstSound = {
        sound: PIXI.sound.Sound.from({
            url: '/sounds/fastinvader1.wav',
            preload: true,
            volume: 0.8
        })
    };

    let fourthSound = {
        sound: PIXI.sound.Sound.from({
            url: '/sounds/fastinvader4.wav',
            preload: true,
            volume: 0.8
        }),
        next: firstSound
    }

    let thirdSound = {
        sound: PIXI.sound.Sound.from({
            url: '/sounds/fastinvader3.wav',
            preload: true,
            volume: 0.8
        }),
        next: fourthSound
    }

    let secondSound = {
        sound: PIXI.sound.Sound.from({
            url: '/sounds/fastinvader2.wav',
            preload: true,
            volume: 0.8
        }),
        next: thirdSound
    }

    firstSound.next = secondSound;

    alienSound = firstSound;
}

initSounds();

const playAlienSound = function () {
    alienSound.sound.play();
    alienSound = alienSound.next;
}

const getBulletContainer = function () {
    const bulletContainer = new PIXI.Container();
    bulletContainer.pivot.y = 0;
    bulletContainer.sprite = getBulletSprite();
    bulletContainer.addChild(bulletContainer.sprite);
    return bulletContainer;
}

const doesSpaceshipCanShoot = function (lastShootTimestamp, minimumShootingInterval) {
    return Date.now() - lastShootTimestamp > minimumShootingInterval;
}

const createBullet = function () {
    const bullet = {
        index: bullets.length,
        container: getBulletContainer(),
        active: false,
        vy: -bulletSpeed
    };
    bullets.push(bullet);
    app.stage.addChild(bullet.container);
    return bullet;
}

const getBullet = function () {
    let unActiveBullets =  bullets.filter(bullet => bullet.active === false);
    if (unActiveBullets.length !== 0) {
        return unActiveBullets[0];
    } else {
        return createBullet();
    }
}

const getAliveAliens = function () {
    return aliens.filter(alien => alien.alive === true);
}

const getIndexArray = function (arrayLength) {
    let array = new Array();
    for (let i = 0; i < arrayLength; i++) {
        array.push(i)
    }
    return array;
}

const getShootingAlienIndex = function () {

}

//TODO Добавить возможность пулям задевать корабль
const getShootingAlienPosition = function () {
    let alienContainer = null;
    let rowLength = aliensArmyContainer.children[0].children.length;
    let columnLength = aliensArmyContainer.children.length;
    let indexArray = getIndexArray(rowLength);
    while (alienContainer === null) {
        let randomIndex = Math.floor(Math.random() * (indexArray.length - 1));
        indexArray.splice(randomIndex, 1);
        let selectedAlienColumnIndex = indexArray[randomIndex];
        let selectedAlienRowIndex = columnLength - 1;
        while (alienContainer === null && selectedAlienRowIndex !== 0) {
            if (aliens[rowLength * selectedAlienRowIndex + selectedAlienColumnIndex].alive === true) {
                alienContainer = aliensArmyContainer.children[selectedAlienRowIndex].children[selectedAlienColumnIndex];
            }
            selectedAlienRowIndex--;
        }
    }
    return {
        x: alienContainer.x + aliensArmyContainer.x,
        y: alienContainer.y + aliensArmyContainer.y + 50
    }
}

const initShoot = function (shooterPositionX, shooterPositionY, bulletVy) {
    let bullet = getBullet();
    bullet.container.sprite.visible = true;
    bullet.container.x = shooterPositionX;
    bullet.container.y = shooterPositionY - bulletHeight - 1;
    bullet.vy = bulletVy;
    bullet.active = true;
    //cannonSound.play();
}

const initAlienShot = function () {
    let shootingAlienPosition = getShootingAlienPosition();
    initShoot(shootingAlienPosition.x, shootingAlienPosition.y, bulletSpeed);
    lastAlienBulletShootTimestamp = Date.now();
}

const doesBulletInsideAliensContainer = function (bulletContainerY) {
    return bulletContainerY > aliensArmyContainer.y && bulletContainerY < aliensArmyContainer.y + aliensArmyContainer.height;
}

const moveBullets = function (delta) {
    let activeBullets = bullets.filter(bullet => bullet.active === true);
    activeBullets.forEach(bullet => {
        bullet.container.y += bullet.vy;
        if (bullet.container.y < -bulletHeight) {
            bullet.active = false;
            return;
        }
        if (doesBulletInsideAliensContainer(bullet.container.y)) {
            checkBulletState(bullet);
        }
    });
}

const doesBulletHitAlienHitbox = function (hitbox, bullet, xOffset, yOffset) {
    return bullet.container.x >= hitbox.minX + xOffset && bullet.container.x <= hitbox.maxX + xOffset && bullet.container.y >= hitbox.minY + yOffset && bullet.container.y <= hitbox.maxY + yOffset;
}

const checkBulletState = async function (bullet) {
    let xContainerOffset = aliensArmyContainer.x;
    let yContainerOffset = aliensArmyContainer.y;
    getAliveAliens().forEach((alien) => {
        if (doesBulletHitAlienHitbox(alien.hitbox, bullet, xContainerOffset, yContainerOffset)) {
            killAlien(alien, bullet);
        }
    })
}

const killAlien = function (alien, bullet) {
    bullet.active = false;
    bullet.container.sprite.visible = false;
    alien.sprite.visible = false;
    alien.alive = false;
}

const randomizeStar = function (star, initial) {
    star.z = initial ? Math.random() * 2000 : cameraZ + Math.random() * 1000 + 2000;

    // Calculate star positions with radial random coordinate so no star hits the camera.
    const deg = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 1;
    star.x = Math.cos(deg) * distance;
    star.y = Math.sin(deg) * distance;
}

const getInitializedBackground = function (app) {
    const background = new PIXI.Container();

    for (let i = 0; i < starAmount; i++) {
        const star = {
            sprite: new PIXI.Sprite(starTexture),
            z: 0,
            x: 0,
            y: 0,
        };
        star.sprite.anchor.x = 0.5;
        star.sprite.anchor.y = 0.7;
        randomizeStar(star, true);
        background.addChild(star.sprite);
        stars.push(star);
    }


    // Listen for animate update
    app.ticker.add((delta) => {
        backgroundSpeed += backgroundSpeed / 20;
        cameraZ += delta * 10 * (backgroundSpeed + baseSpeed);
        for (let i = 0; i < starAmount; i++) {
            const star = stars[i];
            if (star.z < cameraZ) randomizeStar(star);

            // Map star 3d position to 2d with really simple projection
            const z = star.z - cameraZ;
            star.sprite.x = star.x * (fov / z) * app.renderer.screen.width + app.renderer.screen.width / 2;
            star.sprite.y = star.y * (fov / z) * app.renderer.screen.width + app.renderer.screen.height / 2;

            // Calculate star scale & rotation.
            const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
            const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
            const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
            const distanceScale = Math.max(0, (2000 - z) / 2000);
            star.sprite.scale.x = distanceScale * starBaseSize;
            // Star is looking towards center so that y axis is towards center.
            // Scale the star depending on how fast we are moving, what the stretchfactor is and depending on how far away it is from the center.
            star.sprite.scale.y = distanceScale * starBaseSize + distanceScale * backgroundSpeed * starStretch * distanceCenter / app.renderer.screen.width;
            star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
        }
    });

    return background;
}

const keyboard = function (keyName) {
    let key = {};
    key.name = keyName;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.key === key.name) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    key.upHandler = event => {
        if (event.key === key.name) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    window.addEventListener(
        "keydown", key.downHandler.bind(key), true
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), true
    );
    return key;
}

const initCannonMovementButtonActions = function (humanCannonContainer) {
    let left = keyboard("ArrowLeft");
    let right = keyboard("ArrowRight");
    left.press = _ => humanCannonContainer.vx = -5;
    left.release = _ => humanCannonContainer.vx = !right.isDown ? 0 : humanCannonContainer.vx;
    right.press = _ => humanCannonContainer.vx = 5;
    right.release = _ => humanCannonContainer.vx = !left.isDown ? 0 : humanCannonContainer.vx;
}

const initCannonShootAbility = function (humanCannonContainer) {
    let space = keyboard(' ');
    space.release = () => {
        if(doesSpaceshipCanShoot(lastBulletShootTimestamp, humanSpaceshipMinimumShootingInterval)){
            initShoot(humanCannonContainer.x, humanCannonContainer.y, -bulletSpeed)
            lastBulletShootTimestamp = Date.now();
        }
    };
}

const cannonShouldStop = function () {
    return humanCannonContainer.x <= pixelsToGameBorder && humanCannonContainer.vx < 0 || humanCannonContainer.x >= window.innerWidth - pixelsToGameBorder && humanCannonContainer.vx > 0;
}

const alienArmyShouldChangeMovementDirection = function (alien) {
    return alien.x + aliensArmyContainer.x <= pixelsToGameBorder - 50 && aliensArmyContainer.vx < 0 || alien.x +  aliensArmyContainer.x >= window.innerWidth - pixelsToGameBorder + 50 && aliensArmyContainer.vx > 0;
}

const moveCannon = function (delta) {
    if (cannonShouldStop()) return;
    humanCannonContainer.x += humanCannonContainer.vx;
}

const getHumanCannonContainer = function (app) {
    const humanCannonContainer = new PIXI.Container();
    humanCannonContainer.x = window.innerWidth / 2;
    humanCannonContainer.y = window.innerHeight - 50;
    humanCannonContainer.vx = 0;
    humanCannonSprite.anchor.set(0.5);
    humanCannonSprite.scale.set(0.5);
    initCannonMovementButtonActions(humanCannonContainer);
    initCannonShootAbility(humanCannonContainer);
    humanCannonContainer.addChild(humanCannonSprite);
    app.ticker.add(moveCannon);
    app.ticker.add(moveBullets);
    return humanCannonContainer;
}

const getAlienHitbox = function (alien) {
    return {
        minY: alien.y,
        maxY: alien.y + alien.sprite.height,
        minX: alien.x,
        maxX: alien.x + alien.sprite.width
    }
}

const initAlienHitboxes = function () {
    aliens.forEach(alien => alien.hitbox = getAlienHitbox(alien));
}

const getAlienContainer = function (x, y, alienTypeId) {
    let alien = {
        x: x,
        y: y,
        alienTypeId: alienTypeId,
        alive: true,
        state: 0,
        sprite: new PIXI.Sprite(alienTextures[alienTypeId][0]),
        switchSpriteState: () => {
            alien.switchState();
            alien.sprite.texture = alienTextures[alien.alienTypeId][alien.state];
        },
        switchState: () => {
            alien.state = alien.state === 0 ? 1 : 0
        }
    }
    alien.sprite.scale.set(0.3);
    const alienContainer = new PIXI.Container();
    alienContainer.x = alien.x;
    alienContainer.y = alien.y;
    aliens.push(alien);
    alienContainer.addChild(alien.sprite);
    return alienContainer;
}

const getAlienRowContainer = function (alienTypeId) {
    let x = 0;
    const y = alienTypeId * 40;
    alienTextures[alienTypeId] = [PIXI.Texture.from(`/img/alien${alienTypeId}-state0.png`), PIXI.Texture.from(`/img/alien${alienTypeId}-state1.png`)];
    const alienRowContainer = new PIXI.Container();
    for (let i = 0; i < 12; i++){
        alienRowContainer.addChild(getAlienContainer(x, y, alienTypeId));
        x += 50;
    }
    return alienRowContainer;
}

const getAliensArmyContainer = function (app) {
    const aliensArmyContainer = new PIXI.Container();
    for (let i = 0; i < numberOfInvadersRows; i++) {
        aliensArmyContainer.addChild(getAlienRowContainer(i));
    }
    aliensArmyContainer.x = window.innerWidth / 2 - aliensArmyContainer.width / 2 - 15;
    aliensArmyContainer.y = 100;
    aliensArmyContainer.vx = 10;
    return aliensArmyContainer;
}

const background = getInitializedBackground(app);
const humanCannonContainer = getHumanCannonContainer(app);
const aliensArmyContainer = getAliensArmyContainer(app);

app.stage.addChild(background);
app.stage.addChild(humanCannonContainer);
app.stage.addChild(aliensArmyContainer);

const moveAliens = function () {
    let shouldChangeDirection = false;
    getAliveAliens().forEach(alien => {
        alien.switchSpriteState();
        if (!shouldChangeDirection) {
            shouldChangeDirection = alienArmyShouldChangeMovementDirection(alien);
        }
    })
    if (!shouldChangeDirection) {
        aliensArmyContainer.x += aliensArmyContainer.vx;
    } else {
        aliensArmyContainer.y += 10;
        aliensArmyContainer.vx *= -1;
    }
    // playAlienSound();
}

setInterval(moveAliens, 500);

setInterval(initAlienShot, alienShipShootingInterval);

setTimeout(initAlienHitboxes, 500);

document.body.appendChild(app.view);

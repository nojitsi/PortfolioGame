const starTexture = PIXI.Texture.from('https://pixijs.io/examples/examples/assets/star.png');
const humanCannonTexture = PIXI.Texture.from('/img/human-cannon.png');

const bulletHeight = 15;
const numberOfInvadersRows = 5;
const starAmount = 1000;
const bulletSpeed = 10;
let cameraZ = 0;
const fov = 20;
const baseSpeed = 0.025;
let speed = 0;
const starStretch = 5;
const starBaseSize = 0.05;
const stars = [];
const aliens = [];
const bullets = [];
const alienTextures = [];
const humanCannonSprite = new PIXI.Sprite(humanCannonTexture);
const bulletGraphic = new PIXI.Graphics().beginFill(0xFFFFFF).drawRect(100, 100, 2, bulletHeight).endFill();
const pixelsToGameBorder = (window.innerWidth - 600) / 2;

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

const getBulletContainer = function () {
    const bulletContainer = new PIXI.Container();
    bulletContainer.pivot.y = 0;
    bulletContainer.addChild(getBulletSprite());
    return bulletContainer;
}

const createBullet = function () {
    const bullet = {
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

const initCannonShot = function (cannonPositionX, cannonPositionY) {
    let bullet = getBullet();
    bullet.container.x = cannonPositionX;
    bullet.container.y = cannonPositionY - bulletHeight - 1;
    bullet.active = true;
}

const moveBullets = function (delta) {
    let activeBullets = bullets.filter(bullet => bullet.active === true);
    activeBullets.forEach(bullet => {
       bullet.container.y += bullet.vy;
       if (bullet.container.y < - bulletHeight) {
           bullet.active = false;
       }
    });
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
        speed += speed / 20;
        cameraZ += delta * 10 * (speed + baseSpeed);
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
            star.sprite.scale.y = distanceScale * starBaseSize + distanceScale * speed * starStretch * distanceCenter / app.renderer.screen.width;
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

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.name) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
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
    space.release = _ => initCannonShot(humanCannonContainer.x, humanCannonContainer.y);
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

const getAlienContainer = function (x, y, alienTypeId) {
    let alien = {
        x: x,
        y: y,
        alienTypeId: alienTypeId,
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
    alien.sprite.anchor.set(0.5);
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
    alienTextures[alienTypeId] =  [PIXI.Texture.from(`/img/alien${alienTypeId}-state0.png`), PIXI.Texture.from(`/img/alien${alienTypeId}-state1.png`)];
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
    aliensArmyContainer.x = window.innerWidth / 2 - aliensArmyContainer.width / 2;
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

setInterval(() => {
    let shouldChangeDirection = false;
    aliens.forEach(alien => {
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

}, 500)

document.body.appendChild(app.view);
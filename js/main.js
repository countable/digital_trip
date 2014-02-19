// stats
var currentHelth = 100,
    currentScore = 0;

// service variables
var spawnCoord = -200,
    // blurCoord = 3,
    opacityCoord = 2,
    dieCoord = camera.z + 7,
    stonesCloseness = 18;

// SPEED
var speed = {
    value: 6,
    changer: 0,
    step: 0.1
};
    speed.increase = function () {
        this.value += this.step;
    };
    speed.setChanger = function (changer) {
        this.changer = changer;
    };
    speed.getChanger = function() {
        return this.changer;
    };
    speed.getValue = function () {
        return this.value + this.changer;
    };

var increaseSpeed = setInterval(function() {
    speed.increase();
}, 5000);

// collections
var stones = [],
    fragments = [],
    coins = [];

var bonuses = [];
var caughtBonuses = [];

// coordinates of sphere destination point
var destPoint = {x: 0, y: 0};

//////////////////////////////////////////////
// ON RENDER 
//////////////////////////////////////////////

// render the scene
onRenderFcts.push(function(delta, now) {
    renderer.render(scene, camera);
    emitter.update(delta).render();
    stats.update();
});
var lens = camera.lens;
onRenderFcts.push(function() {

    if (speed.getChanger() > 0) {
        camera.position.z = Math.max(camera.position.z -= 0.1, camera.z - 2);
        lens = Math.max(lens -= 0.3, camera.lens - 6)
        composer.render();
    } else if (speed.getChanger() < 0) {
        camera.position.z = Math.min(camera.position.z += 0.05, camera.z + 1);
        lens = Math.min(lens += 0.3, camera.lens + 6);
        composer.render();
    } else {
        var delta = camera.lens - lens;
        if (delta > 0) {
            camera.position.z = Math.min(camera.position.z += 0.1, camera.z);
            lens = Math.min(lens += 0.3, camera.lens);
        } else {
            camera.position.z = Math.max(camera.position.z -= 0.05, camera.z);
            lens = Math.max(lens -= 0.3, camera.lens);
        }
    }
    camera.setLens(lens);
});
// stones lifecicle, rotation and moving
onRenderFcts.push(function() {
    stones.forEach(function(el, ind, arr){
    el.rotation.y += 0.007;
    el.rotation.x += 0.007;
    el.position.z += 0.1 * speed.getValue();
    if (el.position.z > dieCoord) {
        scene.remove(el);
    } 
    if (el.position.z > opacityCoord) {
        el.material = new THREE.MeshLambertMaterial({shading: THREE.FlatShading, transparent: true, opacity: 0.75});
    }
    var distanceBerweenCenters = el.position.distanceTo(sphere.position);
        radiusesSum = sphere.geometry.radius + el.geometry.radius;
        
    if (distanceBerweenCenters < radiusesSum) {
        soundStoneDestroy.update();
        soundStoneDestroy.play();
        // bump(0.2);
        scene.remove(el);
        arr.splice(ind, 1);
        currentHelth = changeHelth(currentHelth, -19);
        // вызвать вспышку экрана
        if (sphere.isInvulnerability === false) {
            hit();
        }
        // генерировать осколки
        generateFragments(scene, fragments, el.position.x, el.position.y, el.position.z);
    }
    if (distanceBerweenCenters > radiusesSum && distanceBerweenCenters < radiusesSum + 1 && el.position.z - sphere.position.z > 1) {
        soundStoneMiss.update();
        soundStoneMiss.play();
    }
    });
});
// stones lifecicle
onRenderFcts.push(function() {
    if (!stones.length) {
        generateStone(scene, stones, spawnCoord);
    }
    var el = stones[stones.length -1];
    if (getDistance(0, 0, spawnCoord, el.position.x, el.position.y, el.position.z) > stonesCloseness) {
        generateStone(scene, stones, spawnCoord);
    }
});
// fragments lifecicle
onRenderFcts.push(function() {
    if (fragments.length) {
        fragments.forEach(function(el, ind, arr) {
            // el.rotation.y += 0.05;
            // el.rotation.x += 0.05;
            el.position.x *= 1.1;
            el.position.y *= 1.1;
            el.position.z += 0.001 * speed.getValue();
            if (el.position.z > dieCoord) {
                scene.remove(el);
                arr.splice(ind, 1);
            }
        });
    }
});
// coins lifecicle
onRenderFcts.push(function() {
    if (!coins.length) {
        x = genCoord();
        y = genCoord();
        for (var i = 0; i < 10; i++) {
            genCoins(scene, coins, spawnCoord - i * 10, x, y, i * 0.25);
        }
    }
    if (coins.length) {
        coins.forEach(function(el, ind, arr) {
            el.rotation.z += 0.05;
            el.position.z += 0.1 * speed.getValue();
            if (el.position.z > dieCoord) {
                scene.remove(el);
                arr.splice(ind, 1);
            }
            if (el.position.z > opacityCoord) {
                el.children.forEach(function(el) {
                    el.material.transparent = true;
                    el.material.opacity = 0.5;
                });
            }
            var distanceBerweenCenters = el.position.distanceTo(sphere.position);
            if (distanceBerweenCenters < 0.9) {
                soundCoin.update();
                soundCoin.play();
                blink.doBlink(0xcfb53b, 60);
                bump();
                scene.remove(el);
                arr.splice(ind, 1);
                currentScore = changeScore(currentScore, 1);
            }
        });
    }
});
// sphere moving
onRenderFcts.push(function() {
    moveSphere(sphere, destPoint);
    sphereLightning.position.x = sphere.position.x
    sphereLightning.position.y = sphere.position.y;
    sphereLight.position.x = sphere.position.x
    sphereLight.position.y = sphere.position.y;
    // sphere.material.color = sphereLightning.color;
});
// bonuses lifecicle
onRenderFcts.push(function() {
    if (!bonuses.length) {
        x = genCoord();
        y = genCoord();
        genBonus(scene, bonuses, -110, x, y, listOfModels);
    }
    if (bonuses.length) {
        bonuses.forEach(function(el, ind, arr) {

            if (el.type === 0) {
                el.rotation.z += 0.05;
            }
            if (el.type === 1) {
                el.rotation.z += 0.05;
            }
            if (el.type === 2) {
                el.rotation.y += 0.05;
            }
            el.position.z += 0.1 * speed.getValue();
            if (el.position.z > dieCoord) {
                scene.remove(el);
                arr.splice(ind, 1);
            }
            if (el.position.z > opacityCoord) {
                el.material = new THREE.MeshLambertMaterial({shading: THREE.FlatShading, transparent: true, opacity: 0.5});
            }
            if (getDistance(
                el.position.x, el.position.y, el.position.z,
                sphere.position.x, sphere.position.y, sphere.position.z) < 1.0) {
                
                if (el.type === 0) {
                    el.rotation.x += 0.2;
                }
                if (el.type === 1) {
                    el.rotation.y += 0.2;
                }
                if (el.type === 2) {
                    el.rotation.z += 0.2;
                }

                el.position.z -= 0.095 * speed.getValue();
                el.scale.x *= 0.9;
                el.scale.y *= 0.9;
                el.scale.z *= 0.9;

                if (getDistance(
                    el.position.x, el.position.y, el.position.z,
                    sphere.position.x, sphere.position.y, sphere.position.z) < 0.9) {
                    
                    scene.remove(el);
                    arr.splice(ind, 1);
                    catchBonus(el.type);
                }
            }
        });
    }
});

onRenderFcts.push(function() {
    if (blink.framesLeft === 0) {
        return;
    }
    if (blink.framesLeft === blink.frames) {
        sphereLight.color.r = sphere.material.color.r = blink.color.r;
        sphereLight.color.g = sphere.material.color.g = blink.color.g;
        sphereLight.color.b = sphere.material.color.b = blink.color.b;
    }
    if (blink.framesLeft < blink.frames) {
        sphereLight.color.r = sphere.material.color.r += blink.dr;
        sphereLight.color.g = sphere.material.color.g += blink.dg;
        sphereLight.color.b = sphere.material.color.b += blink.db;
    }
    blink.framesLeft -= 1;
});
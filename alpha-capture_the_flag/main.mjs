import {getObjectsByPrototype, getTicks} from 'game/utils';
import {Creep, StructureTower} from 'game/prototypes';
import {Flag} from 'arena/prototypes';
import {ERR_NOT_IN_RANGE} from '/game/constants';

let enemyFlag, flag;
let enemyTowers, towers;

let healer1, healer2, healer3, healer4, healer5, healer6;
let attacker1, attacker2, attacker3, attacker4, attacker5, attacker6;
let tank1, tank2

let team1, team2, team3;


function getFriendCreeps() {
    return getObjectsByPrototype(Creep).filter(creep => creep.my);
}
function getEnemyCreeps() {
    return getObjectsByPrototype(Creep).filter(creep => !creep.my);
}
// TODO: 性能问题，重复遍历，需要修改。
function getCreepsByBodyPart(creeps, bodyPart) {
    return creeps.filter(creep => creep.body.some(part => part.type === bodyPart));
}


class Team{
    healer = []; attacker = []; tank = [];
    member = [];

    constructor(member) {
        getCreepsByBodyPart(member, 'heal').forEach(creep => this.healer.push(creep));
        getCreepsByBodyPart(member, 'ranged_attack').forEach(creep => this.attacker.push(creep));
        getCreepsByBodyPart(member, 'attack').forEach(creep => this.tank.push(creep));
        this.member = member;
    }

    getHealTarget() {
        let wounded = this.member.filter(creep => creep.hits < creep.hitsMax);
        wounded.sort((a, b) => {
            return (a.hitsMax - a.hits) - (b.hitsMax - b.hits);
        });
        return wounded[0] ? wounded[0] : this.attacker[0];
    }
    getAttackTarget() {
        let enemyCreeps = getEnemyCreeps();
        enemyCreeps.sort((a, b) => {
            return (a.hitsMax - a.hits) - (b.hitsMax - b.hits);
        });
        return enemyCreeps[0];
    }

    heal() {
        let healTarget = this.getHealTarget();
        this.healer.forEach(healer => {
            if (healer.hits < healer.hitsMax) {
                healer.heal(healTarget);
            } else {
                healer.moveTo(healTarget);
            }
        });
    }

    kill() {
        this.heal();
        let attackTarget = this.getAttackTarget();

        this.tank.forEach(tank => {
            if(tank.attack(attackTarget) === ERR_NOT_IN_RANGE) {
                tank.moveTo(attackTarget);
            }
        });

        this.attacker.forEach(attacker => {
            if(attacker.rangedAttack(attackTarget) === ERR_NOT_IN_RANGE) {
                attacker.moveTo(attackTarget);
            }
        });

    }

    grabFlag() {
        this.heal();
        let attackTarget = this.getAttackTarget();
        this.tank.forEach(tank => {
            tank.moveTo(enemyFlag);
        });
        this.attacker.forEach(attacker => {
            if(attacker.rangedAttack(attackTarget) === ERR_NOT_IN_RANGE) {
                attacker.moveTo(attackTarget);
            }
        });
    }
}

function init() {

    // Flag inits
    let flags = getObjectsByPrototype(Flag);
    enemyFlag = flags.find(flag => !flag.my);
    flag = flags.find(flag => flag.my);

    // Units inits
    let creeps = getFriendCreeps();
    [healer1, healer2, healer3, healer4, healer5, healer6] = getCreepsByBodyPart(creeps, 'heal');
    [attacker1, attacker2, attacker3, attacker4, attacker5, attacker6] = getCreepsByBodyPart(creeps, 'ranged_attack');
    [tank1, tank2] = getCreepsByBodyPart(creeps, 'attack');

    // Team inits
    team1 = new Team([healer1, healer2, attacker1, attacker2, tank1]);
    team2 = new Team([healer3, healer4, attacker3, attacker4, tank2]);
    team3 = new Team([healer5, healer6, attacker5, attacker6]);

    // Towers inits
    let towers = getObjectsByPrototype(StructureTower);
    towers = towers.filter(tower => tower.my);
    enemyTowers = towers.filter(tower => !tower.my);

}

export function loop() {
    console.log('============ ticks:' + getTicks() + ' ============');

    if (getTicks() === 1) {
        init();
    }

    team2.kill();
    team1.grabFlag();
    team3.kill();



}
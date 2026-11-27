import { system } from "@minecraft/server";

const SENSOR_IDS = new Set([
  "playersensor:player_sensor",
  "playersensor:player_sensor_purple",
  "playersensor:player_sensor_red",
  "playersensor:player_sensor_green",
  "playersensor:player_sensor_yellow",
  "playersensor:player_sensor_black",
  "playersensor:player_sensor_orange",
  "playersensor:player_sensor_black_solid"
]);
const ACTIVE_STATE = "playersensor:active";
const CHECK_EVERY_TICKS = 5;

function insideDetectionBox(player, block, face) {
  const p = block.location;
  const x = player.location.x;
  const y = player.location.y;
  const z = player.location.z;

  switch (face) {
    // Pared: 3 de ancho, 1 de profundidad,
    // 3 bloques arriba y 3 abajo.
    case "north":
      return x >= p.x - 1 && x <= p.x + 2 &&
             z >= p.z - 1 && z < p.z &&
             y >= p.y - 3 && y <= p.y + 3;

    case "south":
      return x >= p.x - 1 && x <= p.x + 2 &&
             z > p.z && z <= p.z + 1 &&
             y >= p.y - 3 && y <= p.y + 3;

    case "east":
      return z >= p.z - 1 && z <= p.z + 2 &&
             x > p.x && x <= p.x + 1 &&
             y >= p.y - 3 && y <= p.y + 3;

    case "west":
      return z >= p.z - 1 && z <= p.z + 2 &&
             x >= p.x - 1 && x < p.x &&
             y >= p.y - 3 && y <= p.y + 3;

    // Suelo y techo: conservar comportamiento anterior.
    case "up":
      return x >= p.x && x <= p.x + 1 &&
             z >= p.z && z <= p.z + 1 &&
             y >= p.y - 6 && y <= p.y + 6;

    case "down":
      return x >= p.x && x <= p.x + 1 &&
             z >= p.z && z <= p.z + 1 &&
             y >= p.y - 6 && y <= p.y + 6;

    default:
      return false;
  }
}

const PlayerSensorComponent = {
  onTick({ block }) {
    try {
      if (!block || !SENSOR_IDS.has(block.typeId)) return;
      const face = block.permutation.getState("minecraft:block_face") ?? "up";
      const p = block.location;
      const candidates = block.dimension.getPlayers({
        location: { x: p.x + 0.5, y: p.y + 0.5, z: p.z + 0.5 },
        maxDistance: 8
      });
      const detected = candidates.some(player => insideDetectionBox(player, block, face));
      const active = block.permutation.getState(ACTIVE_STATE) === true;
      if (active !== detected) {
        block.setPermutation(block.permutation.withState(ACTIVE_STATE, detected));
      }
    } catch (error) {
      console.warn(`[PlayerSensor] Error: ${error}`);
    }
  }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("playersensor:detect_players", PlayerSensorComponent);
});

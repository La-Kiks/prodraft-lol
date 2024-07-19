export class urlGen {

    genSquareImg(champName: string) {
        const lowerName = champName.toLowerCase();
        const url = `https://raw.communitydragon.org/latest/game/assets/characters/${lowerName}/hud/${lowerName}_square.png`;
        return url;
    }

    genSquareImgAlt(champName: string) {
        const lowerName = champName.toLowerCase();
        const url = `https://raw.communitydragon.org/latest/game/assets/characters/${lowerName}/hud/${lowerName}_square_0.png`;
        return url;
    }

    genBackgImg(champName: string) {                  // champId: string
        const lowerName = champName.toLowerCase();
        // const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${champId}/${champId}000.jpg`;
        const url = `https://raw.communitydragon.org/latest/game/assets/characters/${lowerName}/skins/base/${lowerName}loadscreen.png`;
        return url;
    }

    genBackgImgAlt(champName: string) {                  // champId: string
        const lowerName = champName.toLowerCase();
        // const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${champId}/${champId}000.jpg`;
        const url = `https://raw.communitydragon.org/latest/game/assets/characters/${lowerName}/skins/base/${lowerName}loadscreen_0.png`;
        return url;
    }

    genPickVoice(champId: string) {
        const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/${champId}.ogg`;
        return url;
    }

    genBanVoice(champId: string) {
        const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-ban-vo/${champId}.ogg`;
        return url;
    }


}


class CaImage extends Image {
    constructor(src) {
        super();
        this.src = src;
        this.loaded = false;
        this.addEventListener("load", function (event) {
            this.loaded = true;
        })
    }
}

class Sprite {
    constructor(spritesheet, sprite_size, indexX, indexY) {
        this.spritesheet = spritesheet;
        this.sprite_size = sprite_size;
        this.indexX = indexX;
        this.indexY = indexY;
    }
    render(ctx, x, y, width, height) {
        if (this.spritesheet.loaded) ctx.drawImage(
            this.spritesheet,
            this.indexX * this.sprite_size,
            this.indexY * this.sprite_size,
            this.sprite_size,
            this.sprite_size,
            x, y, width, height
        );
    }
}
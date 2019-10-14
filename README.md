# photonenarchiv

a vue/nuxt/webpack based static gallery.

## Features

- multiple albums
- progressive image loading with initial blurred preview
- responsive images (images are served in multiple sizes depending on screen size)
- flickr-style image grid
- metadata from EXIF or yaml files
- multi-threaded image processing (see limitations)

## Future Features

- build caching

## Multithreading Limitations
The current implementation relies on sharp.js threading and only processes one source image at a time.
Since each source image results in 7 parallel target size generations, this should be enough for boxes with up to 8 cores.

## Memory Consumption
sharp.js copies each source image buffer for each target size, which results in a bit™ of memory consumption, depending on source image size photonenarchiv can use up to 2GB of memory when generating.
Also note when developing, ALL assets are held in memory, so it's a bad idea to develop with large albums when you don't have a huge amount of free memory.

## Installation and usage

Albums live in `albums/`, create a folder for each album.
```
┣━━ albums
┃   ┣━━ my-album
┃   ┃   ┣━━ index.yml (mandatory)
┃   ┃   ┣━━ thumbnail.jpg (mandatory)
┃   ┃   ┣━━ picture1.jpg
┃   ┃   ┣━━ …
```

Images must have a unique name excluding the file ending!

album config index.yml:
```
name: My Album
defaults:
	license: cc-by
	someOther: Metadata
```

```
npm ci
npm run generate
```

## Metadata

Image Metadata is read from EXIF, a yaml file with the same name as the image, and supplemented by the album defaults.

Priority from high to low: EXIF, $FILENAME.yml, album defaults

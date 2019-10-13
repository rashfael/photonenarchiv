# photonenarchiv

a vue/nuxt/webpack based static gallery.

## Features

- multiple albums
- progressive image loading with initial blurred preview
- flickr-style image grid

## Future Features

- Metadata Display
- build caching
- multi-threaded image processing

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

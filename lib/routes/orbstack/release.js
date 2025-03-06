const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const rootUrl = 'https://docs.orbstack.dev';
    const currentUrl = `${rootUrl}/release-notes`;
    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);

    const items = $('#VPContent > div > div > div.content > div > main > div > div h2')
        .map((_, h2) => {
            const title = $(h2).text();
            const content = $(h2).nextAll('ul').first().html();

            const versionMatch = title.match(/v[\d.]+/)[0];

            const [major, minor = 0, patch = 0] = versionMatch.match(/\d+/g).map(Number);

            let year;
            if (major > 1 || (major === 1 && minor > 9) || (major === 1 && minor === 9 && patch >= 4)) {
                year = 2025;
            } else if (major === 1 && minor >= 4) {
                year = 2024;
            } else {
                year = 2023;
            }
            const pubDate = new Date(`${title.match(/\((\w+ \d+)\)/)[1]} ${year}`).toUTCString();

            const linkHash =
                major === 0 && minor < 8
                    ? title
                          .toLowerCase()
                          .replaceAll(/[\s().\u200B-\u200D]+/g, '-')
                          .replaceAll(/^-|-$/g, '')
                    : versionMatch.replaceAll('.', '-');

            return {
                title,
                link: `${currentUrl}#${linkHash}`,
                description: content,
                pubDate,
            };
        })
        .get();

    ctx.state.data = {
        title: 'Orbstack Release Notes',
        link: currentUrl,
        item: items,
    };
};

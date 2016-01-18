module.exports =
{
	sass:
	{
		src: 'sass/**/*.{sass,scss}',
		dest: 'stylesheets',
		settings:
		{
			sass:
			{
				indentedSyntax: true,
			},
			autoprefixer: {
				browsers: ['last 3 versions']
			},
		},
	},
	js:
	{
		'src': ['javascripts/**/*.js'],
		settings:
		{
		},
	},
};
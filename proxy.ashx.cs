using Esri.ArcGisServer.Rest.Authentication;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;

namespace Proxy
{
	/// <summary>
	/// Summary description for proxy
	/// </summary>
	public class proxy : IHttpHandler
	{
		static readonly Regex allowedRe = new Regex(@"^(route.)?arcgis\.com$", RegexOptions.IgnoreCase);
		static readonly Regex needsToken = new Regex(@"^route.arcgis.com$");

		private static Token _token;

		public static Token Token
		{
			get {
				if (_token == null || !_token.IsValid)
				{
					var svc = new AuthenticationService();
					_token = svc.GetToken(ConfigurationManager.AppSettings["ClientId"], ConfigurationManager.AppSettings["ClientSecret"]);
				}
				return _token; 
			}
		}


		public void ProcessRequest(HttpContext context)
		{
			////if (context.Request.UrlReferrer == null)
			////{
			////	context.Response.ContentType = "text/plain";
			////	context.Response.StatusCode = 403;
			////	context.Response.Write("No Referrer is present.");
			////	return;

			////}
			////else if (string.Compare(context.Request.UrlReferrer.Host, context.Request.Url.Host, true) != 0)
			////{
			////	context.Response.ContentType = "text/plain";
			////	context.Response.StatusCode = 403;
			////	context.Response.Write("The specified host is not permitted by this proxy.");
			////	return;
			////}

			// Get the URL from the query string.
			var url = context.Request.Url.Query.TrimStart('?');
			if (Uri.IsWellFormedUriString(url, UriKind.Absolute))
			{
				Uri uri = new Uri(url);

				if (needsToken.IsMatch(uri.Host))
				{
					var uriBuilder = new UriBuilder(url);
					// Add the token.
					uriBuilder.Query = string.Format("{0}&token={1}", uriBuilder.Query.TrimStart('?'), Token.AccessToken);

					uri = uriBuilder.Uri;
				}

				if (!allowedRe.IsMatch(uri.Host))
				{
					context.Response.ContentType = "text/plain";
					context.Response.StatusCode = 403;
					context.Response.Write("The specified host is not permitted by this proxy.");
					return;
				}

				var req = (HttpWebRequest)HttpWebRequest.Create(uri);

				CopyHeaders(context.Request, req);

				HttpWebResponse resp;

				try
				{
					resp = (HttpWebResponse)req.GetResponse();
					context.Response.Cache.SetMaxAge(TimeSpan.Zero);
				}
				catch (WebException ex)
				{
					// Some status codes (e.g., 304/Redirect) cause an exception.
					// Set the response to the exception's response object.
					resp = (HttpWebResponse)ex.Response;
				}

				CopyResponseHeaders(resp, context.Response);

				context.Response.ContentType = resp.ContentType;
				context.Response.StatusCode = (int)resp.StatusCode;

				if (resp.Headers["Etag"] != null)
				{
					context.Response.AppendHeader("Etag", resp.Headers["Etag"]);
				}



				using (var stream = resp.GetResponseStream())
				{
					stream.CopyTo(context.Response.OutputStream);
				}
			}
			else
			{
				context.Response.StatusCode = 400;
				context.Response.ContentType = "text/plain";
				context.Response.Write("No URI was specified for the proxy.");
				return;
			}
		}

		private void CopyResponseHeaders(HttpWebResponse source, HttpResponse destination)
		{
			Regex dontCopy = new Regex("^((Set-Cookie))$", RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture);
			foreach (string key in source.Headers.Keys)
			{
				if (!dontCopy.IsMatch(key))
				{
					destination.Headers.Add(key, source.Headers[key]);
				}
			}
		}

		/// <summary>
		/// Copies the headers from an <see cref="HttpRequest"/> to a <see cref="WebRequest"/>.
		/// </summary>
		/// <param name="source"></param>
		/// <param name="destination"></param>
		/// <param name="ignorePattern">
		/// <see cref="Regex"/> pattern that specifies which headers to NOT copy over.
		/// </param>
		private static void CopyHeaders(HttpRequest source, HttpWebRequest destination, string ignorePattern = @"(?in)^(User-Agent)$")
		{
			Regex specialRegex = new Regex(@"(?in)^((Accept)|(Host)|(Connection)|(Referer))$");
			Regex ignoreRegex = string.IsNullOrWhiteSpace(ignorePattern) ? null : new Regex(ignorePattern);
			destination.Accept = string.Join(",", source.AcceptTypes);
			foreach (string key in source.Headers.Keys)
			{
				if (specialRegex.IsMatch(key) || (ignoreRegex != null && ignoreRegex.IsMatch(key)))
				{
					continue;
				}

				destination.Headers.Add(key, source.Headers[key]);
			}
			
		}

		public bool IsReusable
		{
			get
			{
				return false;
			}
		}
	}
}
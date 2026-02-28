/*
 * Copyright 2018-present datagear.tech
 *
 * This file is part of DataGear.
 *
 * DataGear is free software: you can redistribute it and/or modify it under the terms of
 * the GNU Lesser General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * DataGear is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with DataGear.
 * If not, see <https://www.gnu.org/licenses/>.
 */

package org.datagear.analysis.support.httpresult;

import java.io.IOException;
import java.io.Reader;

import org.apache.hc.core5.http.ClassicHttpResponse;
import org.apache.hc.core5.http.HttpException;
import org.datagear.analysis.DataSetQuery;
import org.datagear.analysis.support.HttpDataSet;
import org.datagear.util.IOUtil;

/**
 * 文本 HTTP响应结果处理器。
 * 
 * @author datagear@163.com
 *
 */
public class TextHttpResultHandler extends AbstractRawHttpResultHandler
{
	public TextHttpResultHandler()
	{
		super();
	}

	public TextHttpResultHandler(HttpDataSet dataSet, DataSetQuery dataSetQuery, boolean resolveFields)
	{
		super(dataSet, dataSetQuery, resolveFields);
	}

	@Override
	protected Object readRawData(ClassicHttpResponse response) throws HttpException, IOException
	{
		Reader reader = null;

		try
		{
			reader = getReader(response, response.getEntity());
			return IOUtil.readString(reader, false);
		}
		finally
		{
			IOUtil.close(reader);
		}
	}
}